#include <furi.h>
#include <furi_hal.h>
#include <gui/gui.h>
#include <gui/view.h>
#include <gui/view_dispatcher.h>
#include <gui/modules/submenu.h>
#include <gui/modules/widget.h>
#include <notification/notification.h>
#include <notification/notification_messages.h>
#include <input/input.h>
#include <stdarg.h>
#include "combo_cracker_icons.h"

#define TAG "ComboLockCracker"

#define BACKLIGHT_ON 1

#define MAX_VALUES 10
#define MAX_API_KEY_LENGTH 256
#define MAX_MENU_ITEMS 6

typedef struct {
    char* buffer;
    size_t capacity;
    size_t current_pos;
    bool overflow;
} StringBuffer;

StringBuffer* string_buffer_alloc(size_t capacity) {
    StringBuffer* sb = (StringBuffer*)malloc(sizeof(StringBuffer));
    sb->buffer = (char*)malloc(capacity);
    sb->capacity = capacity;
    sb->current_pos = 0;
    sb->overflow = false;
    memset(sb->buffer, 0, capacity);
    return sb;
}

void string_buffer_free(StringBuffer* sb) {
    if(sb) {
        if(sb->buffer) free(sb->buffer);
        free(sb);
    }
}

void string_buffer_append(StringBuffer* sb, const char* format, ...) {
    if(!sb || sb->overflow) return;

    va_list args;
    va_start(args, format);
    int written = vsnprintf(
        sb->buffer + sb->current_pos,
        sb->capacity - sb->current_pos,
        format,
        args);
    va_end(args);

    if(written < 0 || written >= (int)(sb->capacity - sb->current_pos)) {
        sb->overflow = true;
        return;
    }
    sb->current_pos += written;
}

const char* string_buffer_get(StringBuffer* sb) {
    return sb ? sb->buffer : "";
}

void string_buffer_reset(StringBuffer* sb) {
    if(sb) {
        sb->current_pos = 0;
        sb->overflow = false;
        memset(sb->buffer, 0, sb->capacity);
    }
}

typedef struct {
    char api_key[MAX_API_KEY_LENGTH];
    bool api_enabled;
    uint32_t api_config_flags;
} ApiConfig;

typedef enum {
    ComboViewSubmenu,
    ComboViewCracker,
    ComboViewResults,
    ComboViewTutorial,
    ComboViewTutorialNumeric,
    ComboViewTutorialAlpha,
    ComboViewAbout,
    ComboViewSettings,
} ComboView;

typedef enum {
    ComboEventIdRedrawScreen = 0,
    ComboEventIdCalculateCombo = 1,
    ComboEventIdUpdateMenu = 2,
    ComboEventIdToggleSelection = 3,
} ComboEventId;

typedef enum {
    InputModeNormal = 0,
    InputModeNumeric = 1,
    InputModeAlpha = 2,
    InputModeResistance = 3,
} InputMode;

typedef struct {
    InputMode mode;
    uint8_t min_value;
    uint8_t max_value;
    uint8_t step;
    bool allow_repeat;
} InputConfig;

typedef enum {
    ComboSubmenuIndexCracker,
    ComboSubmenuIndexTutorial,
    ComboSubmenuIndexAbout,
    ComboSubmenuIndexSettings,
} ComboSubmenuIndex;

typedef enum _ComboLockType {
    ComboLockTypeNumeric = 0, // zero-init == numeric as default
    ComboLockTypeAlphabetic
} ComboLockType;
#define COMBO_LOCK_TYPE_COUNT (2) // e.g., for modulo operations to iterate...

// store as array of fixed-length strings, so don't need to store 120x pointer values in RAM.
#define LOCK_INDEX_COUNT       (40u)
#define RESISTANCE_INDEX_COUNT (80u)
static const char gc_resistance_labels_numeric[RESISTANCE_INDEX_COUNT][5u] = {
    "0.0",  "0.5",  "1.0",  "1.5",  "2.0",  "2.5",  "3.0",  "3.5",  "4.0",  "4.5",  "5.0",  "5.5",
    "6.0",  "6.5",  "7.0",  "7.5",  "8.0",  "8.5",  "9.0",  "9.5",  "10.0", "10.5", "11.0", "11.5",
    "12.0", "12.5", "13.0", "13.5", "14.0", "14.5", "15.0", "15.5", "16.0", "16.5", "17.0", "17.5",
    "18.0", "18.5", "19.0", "19.5", "20.0", "20.5", "21.0", "21.5", "22.0", "22.5", "23.0", "23.5",
    "24.0", "24.5", "25.0", "25.5", "26.0", "26.5", "27.0", "27.5", "28.0", "28.5", "29.0", "29.5",
    "30.0", "30.5", "31.0", "31.5", "32.0", "32.5", "33.0", "33.5", "34.0", "34.5", "35.0", "35.5",
    "36.0", "36.5", "37.0", "37.5", "38.0", "38.5", "39.0", "39.5",
};
static const char gc_lock_labels_numeric[LOCK_INDEX_COUNT][3u] = {
    "0",  "1",  "2",  "3",  "4",  "5",  "6",  "7",  "8",  "9",  "10", "11", "12", "13",
    "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27",
    "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
};
static const char gc_resistance_labels_alpha[RESISTANCE_INDEX_COUNT][5u] = {
    // NOTE: For whatever reason, I chose for `Y` to be equivalent to `0`
    "Y.00", "Y.25", "Y.50", "Y.75", "A.00", "A.25", "A.50", "A.75", "B.00", "B.25", "B.50", "B.75",
    "C.00", "C.25", "C.50", "C.75", "D.00", "D.25", "D.50", "D.75", "E.00", "E.25", "E.50", "E.75",
    "F.00", "F.25", "F.50", "F.75", "G.00", "G.25", "G.50", "G.75", "H.00", "H.25", "H.50", "H.75",
    "I.00", "I.25", "I.50", "I.75", "L.00", "L.25", "L.50", "L.75", "M.00", "M.25", "M.50", "M.75",
    "N.00", "N.25", "N.50", "N.75", "O.00", "O.25", "O.50", "O.75", "P.00", "P.25", "P.50", "P.75",
    "R.00", "R.25", "R.50", "R.75", "S.00", "S.25", "S.50", "S.75", "T.00", "T.25", "T.50", "T.75",
    "U.00", "U.25", "U.50", "U.75", "W.00", "W.25", "W.50", "W.75",
};
static const char gc_lock_labels_alpha[LOCK_INDEX_COUNT][4u] = {
    // NOTE: For whatever reason, I chose for `Y` to be equivalent to `0`
    "Y", "Y.5", "A", "A.5", "B", "B.5", "C", "C.5", "D", "D.5", "E", "E.5", "F", "F.5",
    "G", "G.5", "H", "H.5", "I", "I.5", "L", "L.5", "M", "M.5", "N", "N.5", "O", "O.5",
    "P", "P.5", "R", "R.5", "S", "S.5", "T", "T.5", "U", "U.5", "W", "W.5",
};

static const char gc_instructions_numeric[] =
    "NUMERIC LOCK TUTORIAL (0-39)\n"
    "===========================\n\n"
    "STEP 1: First Lock Position\n"
    "1. Set dial to 0\n"
    "2. Pull UP firmly on shackle\n"
    "3. Rotate dial COUNTER-CLOCKWISE\n"
    "4. Find groove between half-numbers\n"
    "5. Enter center number (whole #)\n\n"
    "STEP 2: Second Lock Position\n"
    "1. Repeat same process\n"
    "2. Find next groove after first\n"
    "3. Groove between half-numbers\n"
    "4. Enter center number (whole #)\n\n"
    "STEP 3: Resistance Position\n"
    "1. Apply HALF tension on shackle\n"
    "2. Rotate dial CLOCKWISE slowly\n"
    "3. Feel for resistance point\n"
    "4. Note position (can be .0 or .5)\n\n"
    "STEP 4: Verify Results\n"
    "Results show multiple possibilities.\n"
    "Test each one by pulling hard on\n"
    "shackle - greatest give = answer!\n\n"
    "Based on Samy Kamkar's research:\n"
    "https://samy.pl/master/\n";

static const char gc_instructions_alpha[] =
    "ALPHABETIC LOCK TUTORIAL\n"
    "=======================\n\n"
    "Letters: Y, A-W (skip X, Z, Q)\n\n"
    "STEP 1-3: Same as Numeric\n"
    "Use same technique with letters.\n\n"
    "STEP 1: First Lock\n"
    "Set to Y, find groove with\n"
    "letter in center (Y, A, B...)\n\n"
    "STEP 2: Second Lock\n"
    "Repeat process from first lock\n"
    "Find next groove with letter\n\n"
    "STEP 3: Resistance\n"
    "Apply half tension, rotate\n"
    "clockwise to find resistance\n\n"
    "STEP 4: Results & Testing\n"
    "Algorithm adapts automatically!\n"
    "Test results same as numeric.\n\n"
    "Info: github.com/javidrezai/\n"
    "ComboCracker-FZ\n";

typedef struct {
    ViewDispatcher* view_dispatcher;
    NotificationApp* notifications;
    Submenu* submenu;
    View* view_cracker;
    Widget* widget_results;
    Widget* widget_tutorial;
    Widget* widget_tutorial_numeric;
    Widget* widget_tutorial_alpha;
    Widget* widget_about;
    Widget* widget_settings;

    ApiConfig* api_config;
    StringBuffer* ui_buffer;

    FuriTimer* timer;
    uint8_t menu_selected;
    uint8_t menu_scroll_offset;
} ComboLockCrackerApp;

typedef struct {
    ComboLockType lock_type;
    uint8_t first_lock_index;
    uint8_t second_lock_index;
    uint8_t resistance_index;

    int selected;
    char result[256];
    bool api_used;
    bool high_confidence;
} ComboLockCrackerModel;

typedef struct {
    uint8_t second_pin_count; // variable number of pins for second digit [1..MAX_VALUES]
    uint8_t third_pin_count; // variable number of pins for third digit   [1..MAX_VALUES]
    uint8_t first_pin_index; // first pin is directly calculated (no guesswork)
    uint8_t second_pin_index[MAX_VALUES]; // up to MAX_VALUES entries
    uint8_t third_pin_index[MAX_VALUES]; //  up to MAX_VALUES entries
} ComboLockCombination;

/**
 * @brief      helper to get string for the resistance value
 * @param      model   the ComboLockCrackerModel to obtain resistance value for
 * @return     string representation of the float
 */

static const char* lock1_label_from_model(const ComboLockCrackerModel* model) {
    switch(model->lock_type) {
    case ComboLockTypeNumeric:
        return gc_lock_labels_numeric[model->first_lock_index];
    case ComboLockTypeAlphabetic:
        return gc_lock_labels_alpha[model->first_lock_index];
    default:
        return "?L1?";
    }
}
static const char* lock2_label_from_model(const ComboLockCrackerModel* model) {
    switch(model->lock_type) {
    case ComboLockTypeNumeric:
        return gc_lock_labels_numeric[model->second_lock_index];
    case ComboLockTypeAlphabetic:
        return gc_lock_labels_alpha[model->second_lock_index];
    default:
        return "?L2?";
    }
}
static const char* resistance_label_from_model(const ComboLockCrackerModel* model) {
    switch(model->lock_type) {
    case ComboLockTypeNumeric:
        return gc_resistance_labels_numeric[model->resistance_index];
    case ComboLockTypeAlphabetic:
        return gc_resistance_labels_alpha[model->resistance_index];
    default:
        return "?RR?";
    }
}
static const char* label_from_solution_index(const ComboLockCrackerModel* model, int index) {
    switch(model->lock_type) {
    case ComboLockTypeNumeric:
        return gc_lock_labels_numeric[index];
    case ComboLockTypeAlphabetic:
        return gc_lock_labels_alpha[index];
    default:
        return "?SS?";
    }
}
static const char* lock_type_label(const ComboLockCrackerModel* model) {
    switch(model->lock_type) {
    case ComboLockTypeAlphabetic:
        return "Alpha";
    case ComboLockTypeNumeric:
        return "Numeric";
    }
    return "????";
}

static void api_config_set_key(ApiConfig* config, const char* api_key) {
    if(!config || !api_key) return;
    snprintf(config->api_key, sizeof(config->api_key), "%s", api_key);
    config->api_enabled = (strlen(api_key) > 0);
}

static const char* api_config_get_key(ApiConfig* config) {
    return config ? config->api_key : "";
}

static void api_config_enable(ApiConfig* config, bool enable) {
    if(config) config->api_enabled = enable;
}

static bool api_config_is_enabled(ApiConfig* config) {
    return config && config->api_enabled && (strlen(config->api_key) > 0);
}

static void api_config_set_flag(ApiConfig* config, uint32_t flag, bool value) {
    if(!config) return;
    if(value) {
        config->api_config_flags |= flag;
    } else {
        config->api_config_flags &= ~flag;
    }
}

static void input_cycle_selection_up(ComboLockCrackerModel* model, uint8_t max_selections) {
    if(model->selected > 0) {
        model->selected--;
    } else {
        model->selected = max_selections - 1;
    }
}

static void input_cycle_selection_down(ComboLockCrackerModel* model, uint8_t max_selections) {
    model->selected = (model->selected < max_selections - 1) ? model->selected + 1 : 0;
}

static void input_adjust_first_lock(ComboLockCrackerModel* model, int8_t delta) {
    int16_t new_val = (int16_t)model->first_lock_index + delta;
    if(new_val < 0) new_val = 0;
    if(new_val > 39) new_val = 39;
    model->first_lock_index = (uint8_t)new_val;
}

static void input_adjust_second_lock(ComboLockCrackerModel* model, int8_t delta) {
    int16_t new_val = (int16_t)model->second_lock_index + delta;
    if(new_val < 0) new_val = 0;
    if(new_val > 39) new_val = 39;
    model->second_lock_index = (uint8_t)new_val;
}

static void input_adjust_resistance(ComboLockCrackerModel* model, int8_t delta) {
    int16_t new_val = (int16_t)model->resistance_index + delta;
    if(new_val < 0) new_val = 0;
    if(new_val > 79) new_val = 79;
    model->resistance_index = (uint8_t)new_val;
}

static void input_cycle_lock_type(ComboLockCrackerModel* model) {
    model->lock_type = (model->lock_type + 1) % COMBO_LOCK_TYPE_COUNT;
}

static int SolutionComparator(const ComboLockCombination* r1, const ComboLockCombination* r2) {
    if((r1 == NULL) && (r2 == NULL)) {
        // LOG A WARNING ... as this was likely unintentional
        return 0;
    }
    if(r1 == NULL) {
        return -1;
    }
    if(r2 == NULL) {
        return 1;
    }

    if(r1->second_pin_count != r2->second_pin_count) {
        return r1->second_pin_count - r2->second_pin_count;
    }
    if(r1->third_pin_count != r2->third_pin_count) {
        return r1->third_pin_count - r2->third_pin_count;
    }
    if(r1->first_pin_index != r2->first_pin_index) {
        return r1->first_pin_index - r2->first_pin_index;
    }
    for(unsigned int i = 0; i < r1->second_pin_count; ++i) {
        if(r1->second_pin_index[i] != r2->second_pin_index[i]) {
            return r1->second_pin_index[i] - r2->second_pin_index[i];
        }
    }
    for(unsigned int i = 0; i < r1->third_pin_count; ++i) {
        if(r1->third_pin_index[i] != r2->third_pin_index[i]) {
            return r1->third_pin_index[i] - r2->third_pin_index[i];
        }
    }
    return 0;
}
static void dump_state_and_combinations_to_model_result(
    ComboLockCrackerModel* model,
    const ComboLockCombination* r1,
    const ComboLockCombination* r2) {
    memset(model->result, 0, sizeof(model->result));
    int remaining_bytes = sizeof(model->result) - 1;
    char* b = model->result;
    int written;

    written = snprintf(b, remaining_bytes, "No Solution?\n");
    if((written < 0) || (written >= remaining_bytes)) {
        // can't add anything more, so return.
        return;
    }
    remaining_bytes -= written;
    b += written;

    // write indices
    written = snprintf(
        b,
        remaining_bytes,
        "M: %d, %d, %d",
        model->first_lock_index,
        model->second_lock_index,
        model->resistance_index);
    if((written < 0) || (written >= remaining_bytes)) {
        // can't add anything more, so return.
        return;
    }
    remaining_bytes -= written;
    b += written;

    // write result1 (if non-null)
    if(r1 != NULL) {
        const ComboLockCombination* tmp = r1;
        const char rnum = '1';

        written = snprintf(
            b,
            remaining_bytes,
            "\nR%c: %d  %d(",
            rnum,
            tmp->first_pin_index,
            tmp->second_pin_count);
        if((written < 0) || (written >= remaining_bytes)) {
            // can't add anything more, so return.
            return;
        }
        remaining_bytes -= written;
        b += written;

        // second pin indices
        for(uint8_t i = 0; i < tmp->second_pin_count; ++i) {
            written =
                snprintf(b, remaining_bytes, (i == 0) ? "%d" : ", %d", tmp->second_pin_index[i]);
            if((written < 0) || (written >= remaining_bytes)) {
                // can't add anything more, so return.
                return;
            }
            remaining_bytes -= written;
            b += written;
        }
        written = snprintf(b, remaining_bytes, ") %d(", tmp->third_pin_count);
        if((written < 0) || (written >= remaining_bytes)) {
            // can't add anything more, so return.
            return;
        }
        remaining_bytes -= written;
        b += written;

        // third pin indices
        for(uint8_t i = 0; i < tmp->third_pin_count; ++i) {
            written =
                snprintf(b, remaining_bytes, (i == 0) ? "%d" : ", %d", tmp->third_pin_index[i]);
            if((written < 0) || (written >= remaining_bytes)) {
                // can't add anything more, so return.
                return;
            }
            remaining_bytes -= written;
            b += written;
        }
        written = snprintf(b, remaining_bytes, ")");
        if((written < 0) || (written >= remaining_bytes)) {
            // can't add anything more, so return.
            return;
        }
        remaining_bytes -= written;
        b += written;
    }
    if(r2 != NULL) {
        const ComboLockCombination* tmp = r2;
        const char rnum = '2';

        written = snprintf(
            b,
            remaining_bytes,
            "\nR%c: %d  %d(",
            rnum,
            tmp->first_pin_index,
            tmp->second_pin_count);
        if((written < 0) || (written >= remaining_bytes)) {
            // can't add anything more, so return.
            return;
        }
        remaining_bytes -= written;
        b += written;

        // second pin indices
        for(uint8_t i = 0; i < tmp->second_pin_count; ++i) {
            written =
                snprintf(b, remaining_bytes, (i == 0) ? "%d" : ", %d", tmp->second_pin_index[i]);
            if((written < 0) || (written >= remaining_bytes)) {
                // can't add anything more, so return.
                return;
            }
            remaining_bytes -= written;
            b += written;
        }
        written = snprintf(b, remaining_bytes, ") %d(", tmp->third_pin_count);
        if((written < 0) || (written >= remaining_bytes)) {
            // can't add anything more, so return.
            return;
        }
        remaining_bytes -= written;
        b += written;

        // third pin indices
        for(uint8_t i = 0; i < tmp->third_pin_count; ++i) {
            written =
                snprintf(b, remaining_bytes, (i == 0) ? "%d" : ", %d", tmp->third_pin_index[i]);
            if((written < 0) || (written >= remaining_bytes)) {
                // can't add anything more, so return.
                return;
            }
            remaining_bytes -= written;
            b += written;
        }
        written = snprintf(b, remaining_bytes, ")");
        if((written < 0) || (written >= remaining_bytes)) {
            // can't add anything more, so return.
            return;
        }
        remaining_bytes -= written;
        b += written;
    }

    // that's it ... best effort completed
    return;
}

static void
    calculate_solution(const ComboLockCrackerModel* model, ComboLockCombination* solution) {
    // First things first... zero the solution structure
    memset(solution, 0, sizeof(ComboLockCombination));

    // calculate first pin (index == value for numeric combo locks)
    if(true) {
        // From old code:
        //     For numeric locks (0..39):
        //         If the resistance float value corresponds to a whole number:
        //             the first digit is: (int(number) + 5)
        //         Else:
        //             round up:           (int(number) + 5) + 1
        //
        // Converting to calculations using resistance indices 0..79:
        //     Get integer value:           (index / 2)
        //     Is index for a Whole number: (index % 2u == 0u)
        //
        // Thus, the first digit is calculated as:

        unsigned int pin0 = model->resistance_index / 2u;
        if(model->resistance_index % 2u != 0u) {
            pin0 += 6;
        } else {
            pin0 += 5;
        }
        pin0 %= LOCK_INDEX_COUNT;
        solution->first_pin_index = pin0;
    }

    uint8_t remainder = solution->first_pin_index % 4;

    // calculate the potential THIRD pins
    if(true) {
        uint8_t a = model->first_lock_index; //  index == value for numeric combo locks
        uint8_t b = model->second_lock_index; // index == value for numeric combo locks

        // Third digit:
        //    Check N, N+10, N+20, N+30 (for N is either of the two lock indices)
        // If any of those (value % 4) == (first pin % 4),
        // then it's a potential solution.
        //
        // Typically:
        // * lock1 and lock2 are offset by an odd value
        // * thus, only one of them would ever match the modulo by adding multiples of 10.
        // * 10 % 4 == 2, so only half the additions (+0, +10, +20, +30) will match the modulo.
        // * Thus, expect to get two values stored.
        // * NOTE: Invalid inputs might store 4 values.
        for(uint8_t i = 0u; i < 4u; i++) {
            if((a % 4u) == remainder) {
                solution->third_pin_index[solution->third_pin_count++] = a;
            }
            if((b % 4u) == remainder) {
                solution->third_pin_index[solution->third_pin_count++] = b;
            }
            a = (a + 10u) % 40u;
            b = (b + 10u) % 40u;
        }
    }

    // calculate the potential SECOND pins
    if(true) {
        // first two possibilities: remainder + 2, remainder + 6
        // Note that modulo here is redundant, as remainder is in range [0..3]
        uint8_t row_1 = (remainder + 2) % LOCK_INDEX_COUNT;
        uint8_t row_2 = (row_1 + 4) % LOCK_INDEX_COUNT;
        solution->second_pin_index[solution->second_pin_count++] = row_1;
        solution->second_pin_index[solution->second_pin_count++] = row_2;

        for(uint8_t i = 0u; i < 4u; i++) {
            row_1 = (row_1 + 8u) % LOCK_INDEX_COUNT;
            row_2 = (row_2 + 8u) % LOCK_INDEX_COUNT;
            solution->second_pin_index[solution->second_pin_count++] = row_1;
            solution->second_pin_index[solution->second_pin_count++] = row_2;
        }
    }
    // O(n^2) sorting of second pin numbers ... but as n is small (~8) it's good enough
    for(uint8_t i = 0; i < solution->second_pin_count - 1; i++) {
        // ensure smallest of all remaining values is in index i...
        for(uint8_t j = i + 1; j < solution->second_pin_count; j++) {
            // by comparing against all the remaining indices
            if(solution->second_pin_index[i] > solution->second_pin_index[j]) {
                // swap the values so smallest value comes first
                uint8_t temp = solution->second_pin_index[i];
                solution->second_pin_index[i] = solution->second_pin_index[j];
                solution->second_pin_index[j] = temp;
            }
        }
    }
}

static void
    fill_model_result_with_solution(ComboLockCrackerModel* model, ComboLockCombination* solution) {
    StringBuffer* sb = string_buffer_alloc(sizeof(model->result));

    const char* first_label = label_from_solution_index(model, solution->first_pin_index);
    string_buffer_append(sb, "First Pin: %s\nSecond Pin(s): ", first_label);

    for(uint8_t i = 0; i < solution->second_pin_count; i++) {
        const char* s = label_from_solution_index(model, solution->second_pin_index[i]);
        string_buffer_append(sb, "%s", s);

        if(i < solution->second_pin_count - 1) {
            const char* sep = (i == 3) ? ",\n -> " : ", ";
            string_buffer_append(sb, "%s", sep);
        }
    }

    string_buffer_append(sb, "\nThird Pin(s): ");

    for(uint8_t i = 0; i < solution->third_pin_count; i++) {
        const char* s = label_from_solution_index(model, solution->third_pin_index[i]);
        string_buffer_append(sb, "%s", s);

        if(i < solution->third_pin_count - 1) {
            string_buffer_append(sb, ", ");
        }
    }

    if(!sb->overflow) {
        snprintf(model->result, sizeof(model->result), "%s", string_buffer_get(sb));
    } else {
        snprintf(model->result, sizeof(model->result), "Buffer overflow - result truncated");
    }

    string_buffer_free(sb);
}
/**
 * @brief      calculate the combination based on inputs, AND displays the results
 * @param      model   the model containing input values
 */
static void calculate_combo(ComboLockCrackerModel* model) {
    ComboLockCombination result = {};
    calculate_solution(model, &result);
    if((result.third_pin_count < 1) || (result.second_pin_count < 1)) {
        (void)SolutionComparator;
        dump_state_and_combinations_to_model_result(model, &result, NULL);
        return;
    }

    fill_model_result_with_solution(model, &result);
}

/**
 * @brief      callback for exiting the application.
 * @details    this function is called when user press back button.
 * @param      _context  the context - unused
 * @return     next view id
 */
static uint32_t combo_navigation_exit_callback(void* _context) {
    UNUSED(_context);
    return VIEW_NONE;
}

/**
 * @brief      callback for returning to submenu.
 * @details    this function is called when user press back button.
 * @param      _context  the context - unused
 * @return     next view id
 */
static uint32_t combo_navigation_submenu_callback(void* _context) {
    UNUSED(_context);
    return ComboViewSubmenu;
}

/**
 * @brief      handle submenu item selection.
 * @details    this function is called when user selects an item from the submenu.
 * @param      context  the context - ComboLockCrackerApp object.
 * @param      index    the ComboSubmenuIndex item that was clicked.
 */
static void combo_submenu_callback(void* context, uint32_t index) {
    ComboLockCrackerApp* app = (ComboLockCrackerApp*)context;
    switch(index) {
    case ComboSubmenuIndexCracker:
        view_dispatcher_switch_to_view(app->view_dispatcher, ComboViewCracker);
        break;
    case ComboSubmenuIndexTutorial:
        view_dispatcher_switch_to_view(app->view_dispatcher, ComboViewTutorial);
        break;
    case ComboSubmenuIndexAbout:
        view_dispatcher_switch_to_view(app->view_dispatcher, ComboViewAbout);
        break;
    case ComboSubmenuIndexSettings:
        view_dispatcher_switch_to_view(app->view_dispatcher, ComboViewSettings);
        break;
    default:
        break;
    }
}

/**
 * @brief      callback for drawing the cracker screen.
 * @details    this function is called when the screen needs to be redrawn.
 * @param      canvas  the canvas to draw on.
 * @param      model   the model - ComboLockCrackerModel object.
 */
static void combo_view_cracker_draw_callback(Canvas* canvas, void* model) {
    ComboLockCrackerModel* my_model = (ComboLockCrackerModel*)model;

    canvas_clear(canvas);
    canvas_set_font(canvas, FontSecondary);

    char buf[16];
    int icon_width = 32;
    int icon_x = 128 - icon_width - 2;
    int icon_y = 2;
    int text_x = 2;
    int value_x = 75;
    int indicator_offset = -5;

    canvas_draw_str(canvas, text_x, 12, "First Lock:");
    snprintf(buf, sizeof(buf), "%s", lock1_label_from_model(my_model));
    canvas_draw_str(
        canvas,
        value_x + (my_model->selected == 0 ? indicator_offset : 0),
        12,
        (my_model->selected == 0 ? ">" : ""));
    canvas_draw_str(canvas, value_x, 12, buf);

    canvas_draw_str(canvas, text_x, 24, "Second Lock:");
    snprintf(buf, sizeof(buf), "%s", lock2_label_from_model(my_model));
    canvas_draw_str(
        canvas,
        value_x + (my_model->selected == 1 ? indicator_offset : 0),
        24,
        (my_model->selected == 1 ? ">" : ""));
    canvas_draw_str(canvas, value_x, 24, buf);

    canvas_draw_str(canvas, text_x, 36, "Resistance:");
    snprintf(buf, sizeof(buf), "%s", resistance_label_from_model(my_model));
    canvas_draw_str(
        canvas,
        value_x + (my_model->selected == 2 ? indicator_offset : 0),
        36,
        (my_model->selected == 2 ? ">" : ""));
    canvas_draw_str(canvas, value_x, 36, buf);

    canvas_draw_str(canvas, text_x, 48, "LockType: ");
    snprintf(buf, sizeof(buf), "%s", lock_type_label(my_model));
    canvas_draw_str(
        canvas,
        value_x + (my_model->selected == 3 ? indicator_offset : 0),
        48,
        (my_model->selected == 3 ? ">" : ""));
    canvas_draw_str(canvas, value_x, 48, buf);

    canvas_draw_line(canvas, 0, 56, 128, 56);
    canvas_set_font(canvas, FontTiny);
    canvas_draw_str(canvas, 2, 64, "< UP/DOWN > OK:Calc");
    canvas_draw_str(canvas, 100, 64, "v0.6");

    canvas_draw_icon(canvas, icon_x, icon_y, &I_lock32x32);
}

/**
 * @brief      callback for cracker screen input.
 * @details    this function is called when the user presses or holds a button while on the cracker screen.
 * @param      event    the event - InputEvent object.
 * @param      context  the context - ComboLockCrackerApp object.
 * @return     true if the event was handled, false otherwise.
 */
static bool combo_view_cracker_input_callback(InputEvent* event, void* context) {
    ComboLockCrackerApp* app = (ComboLockCrackerApp*)context;
    bool redraw = true;

    if(event->type == InputTypeShort) {
        switch(event->key) {
        case InputKeyUp:
            with_view_model(
                app->view_cracker,
                ComboLockCrackerModel * model,
                { input_cycle_selection_up(model, 4); },
                redraw);
            break;
        case InputKeyDown:
            with_view_model(
                app->view_cracker,
                ComboLockCrackerModel * model,
                { input_cycle_selection_down(model, 4); },
                redraw);
            break;
        case InputKeyLeft:
            with_view_model(
                app->view_cracker,
                ComboLockCrackerModel * model,
                {
                    if(model->selected == 0) input_adjust_first_lock(model, -1);
                    else if(model->selected == 1) input_adjust_second_lock(model, -1);
                    else if(model->selected == 2) input_adjust_resistance(model, -1);
                    else if(model->selected == 3) {
                        model->lock_type =
                            (model->lock_type + COMBO_LOCK_TYPE_COUNT - 1) % COMBO_LOCK_TYPE_COUNT;
                    }
                },
                redraw);
            break;
        case InputKeyRight:
            with_view_model(
                app->view_cracker,
                ComboLockCrackerModel * model,
                {
                    if(model->selected == 0) input_adjust_first_lock(model, 1);
                    else if(model->selected == 1) input_adjust_second_lock(model, 1);
                    else if(model->selected == 2) input_adjust_resistance(model, 1);
                    else if(model->selected == 3) input_cycle_lock_type(model);
                },
                redraw);
            break;
        case InputKeyOk:
            view_dispatcher_send_custom_event(app->view_dispatcher, ComboEventIdCalculateCombo);
            return true;
        default:
            break;
        }
    } else if(event->type == InputTypeRepeat) {
        switch(event->key) {
        case InputKeyLeft:
            with_view_model(
                app->view_cracker,
                ComboLockCrackerModel * model,
                {
                    if(model->selected == 0) input_adjust_first_lock(model, -1);
                    else if(model->selected == 1) input_adjust_second_lock(model, -1);
                    else if(model->selected == 2) input_adjust_resistance(model, -1);
                    else if(model->selected == 3) {
                        model->lock_type =
                            (model->lock_type + COMBO_LOCK_TYPE_COUNT - 1) % COMBO_LOCK_TYPE_COUNT;
                    }
                },
                redraw);
            break;
        case InputKeyRight:
            with_view_model(
                app->view_cracker,
                ComboLockCrackerModel * model,
                {
                    if(model->selected == 0) input_adjust_first_lock(model, 1);
                    else if(model->selected == 1) input_adjust_second_lock(model, 1);
                    else if(model->selected == 2) input_adjust_resistance(model, 1);
                    else if(model->selected == 3) input_cycle_lock_type(model);
                },
                redraw);
            break;
        default:
            break;
        }
    }

    return false;
}

/**
 * @brief      callback for custom events.
 * @details    this function is called when a custom event is sent to the view dispatcher.
 * @param      event    the event id - ComboEventId value.
 * @param      context  the context - ComboLockCrackerApp object.
 */
static bool combo_view_cracker_custom_event_callback(uint32_t event, void* context) {
    ComboLockCrackerApp* app = (ComboLockCrackerApp*)context;

    switch(event) {
    case ComboEventIdRedrawScreen: {
        bool redraw = true;
        with_view_model(
            app->view_cracker, ComboLockCrackerModel * _model, { UNUSED(_model); }, redraw);
        return true;
    }
    case ComboEventIdCalculateCombo: {
        bool redraw = false;
        with_view_model(
            app->view_cracker,
            ComboLockCrackerModel * model,
            {
                calculate_combo(model);
                widget_reset(app->widget_results);
                widget_add_text_scroll_element(app->widget_results, 2, 2, 124, 60, model->result);
            },
            redraw);

        view_dispatcher_switch_to_view(app->view_dispatcher, ComboViewResults);
        return true;
    }
    default:
        return false;
    }
}

static ComboLockCrackerApp* combo_app_alloc() {
    ComboLockCrackerApp* app = (ComboLockCrackerApp*)malloc(sizeof(ComboLockCrackerApp));
    memset(app, 0, sizeof(ComboLockCrackerApp));

    app->api_config = (ApiConfig*)malloc(sizeof(ApiConfig));
    memset(app->api_config, 0, sizeof(ApiConfig));
    app->api_config->api_enabled = false;

    app->ui_buffer = string_buffer_alloc(512);
    app->menu_selected = 0;
    app->menu_scroll_offset = 0;

    Gui* gui = furi_record_open(RECORD_GUI);

    app->view_dispatcher = view_dispatcher_alloc();
    view_dispatcher_attach_to_gui(app->view_dispatcher, gui, ViewDispatcherTypeFullscreen);
    view_dispatcher_set_event_callback_context(app->view_dispatcher, app);

    app->submenu = submenu_alloc();
    submenu_add_item(
        app->submenu, "Crack Lock", ComboSubmenuIndexCracker, combo_submenu_callback, app);
    submenu_add_item(
        app->submenu, "Tutorial", ComboSubmenuIndexTutorial, combo_submenu_callback, app);
    submenu_add_item(
        app->submenu, "Settings", ComboSubmenuIndexSettings, combo_submenu_callback, app);
    submenu_add_item(app->submenu, "About", ComboSubmenuIndexAbout, combo_submenu_callback, app);
    view_set_previous_callback(submenu_get_view(app->submenu), combo_navigation_exit_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewSubmenu, submenu_get_view(app->submenu));
    view_dispatcher_switch_to_view(app->view_dispatcher, ComboViewSubmenu);

    app->view_cracker = view_alloc();
    view_set_draw_callback(app->view_cracker, combo_view_cracker_draw_callback);
    view_set_input_callback(app->view_cracker, combo_view_cracker_input_callback);
    view_set_previous_callback(app->view_cracker, combo_navigation_submenu_callback);
    view_set_context(app->view_cracker, app);
    view_set_custom_callback(app->view_cracker, combo_view_cracker_custom_event_callback);
    view_allocate_model(app->view_cracker, ViewModelTypeLockFree, sizeof(ComboLockCrackerModel));

    ComboLockCrackerModel* model = view_get_model(app->view_cracker);
    model->first_lock_index = 1;
    model->second_lock_index = 8;
    model->resistance_index = 40;
    model->selected = 0;
    memset(model->result, 0, sizeof(model->result));

    view_dispatcher_add_view(app->view_dispatcher, ComboViewCracker, app->view_cracker);

    app->widget_results = widget_alloc();
    view_set_previous_callback(
        widget_get_view(app->widget_results), combo_navigation_submenu_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewResults, widget_get_view(app->widget_results));

    app->widget_tutorial = widget_alloc();
    widget_add_text_scroll_element(
        app->widget_tutorial,
        0,
        0,
        128,
        64,
        "Tutorial - Choose:\n\n"
        "[1] Numeric Locks (0-39)\n\n"
        "[2] Alphabetic Locks (Y,A-W)\n\n"
        "Use UP/DOWN to select\n"
        "Press OK to view");
    view_set_previous_callback(
        widget_get_view(app->widget_tutorial), combo_navigation_submenu_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewTutorial, widget_get_view(app->widget_tutorial));

    app->widget_tutorial_numeric = widget_alloc();
    widget_add_text_scroll_element(
        app->widget_tutorial_numeric, 0, 0, 128, 64, gc_instructions_numeric);
    view_set_previous_callback(
        widget_get_view(app->widget_tutorial_numeric), combo_navigation_submenu_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewTutorialNumeric, widget_get_view(app->widget_tutorial_numeric));

    app->widget_tutorial_alpha = widget_alloc();
    widget_add_text_scroll_element(
        app->widget_tutorial_alpha, 0, 0, 128, 64, gc_instructions_alpha);
    view_set_previous_callback(
        widget_get_view(app->widget_tutorial_alpha), combo_navigation_submenu_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewTutorialAlpha, widget_get_view(app->widget_tutorial_alpha));

    const char* settings_text =
        "Settings\n"
        "---\n"
        "API Key: Not configured\n"
        "Backlight: ON\n"
        "Lock Type: Numeric\n\n"
        "Press OK to configure\n";

    app->widget_settings = widget_alloc();
    widget_add_text_scroll_element(app->widget_settings, 0, 0, 128, 64, settings_text);
    view_set_previous_callback(
        widget_get_view(app->widget_settings), combo_navigation_submenu_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewSettings, widget_get_view(app->widget_settings));

    app->widget_about = widget_alloc();
    widget_add_text_scroll_element(
        app->widget_about,
        0,
        0,
        128,
        64,
        "Combo Lock Cracker v0.6\n"
        "---\n"
        "Based on Samy Kamkar's research.\n"
        "Crack locks in 8 attempts or less.\n\n"
        "GitHub:\n"
        "github.com/javidrezai/\n"
        "ComboCracker-FZ\n\n"
        "https://samy.pl/master/\n");
    view_set_previous_callback(
        widget_get_view(app->widget_about), combo_navigation_submenu_callback);
    view_dispatcher_add_view(
        app->view_dispatcher, ComboViewAbout, widget_get_view(app->widget_about));

    app->notifications = furi_record_open(RECORD_NOTIFICATION);

    notification_message(app->notifications, &sequence_display_backlight_enforce_on);

    return app;
}

/**
 * @brief      free the combo application.
 * @details    this function frees the application resources.
 * @param      app  the application object.
 */
static void combo_app_free(ComboLockCrackerApp* app) {
#ifdef BACKLIGHT_ON
    notification_message(app->notifications, &sequence_display_backlight_enforce_auto);
#endif
    furi_record_close(RECORD_NOTIFICATION);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewAbout);
    widget_free(app->widget_about);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewSettings);
    widget_free(app->widget_settings);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewTutorialAlpha);
    widget_free(app->widget_tutorial_alpha);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewTutorialNumeric);
    widget_free(app->widget_tutorial_numeric);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewTutorial);
    widget_free(app->widget_tutorial);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewResults);
    widget_free(app->widget_results);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewCracker);
    view_free(app->view_cracker);

    view_dispatcher_remove_view(app->view_dispatcher, ComboViewSubmenu);
    submenu_free(app->submenu);

    view_dispatcher_free(app->view_dispatcher);
    furi_record_close(RECORD_GUI);

    if(app->api_config) free(app->api_config);
    if(app->ui_buffer) string_buffer_free(app->ui_buffer);

    free(app);
}

int32_t combo_cracker_app(void* _p) {
    UNUSED(_p);

    ComboLockCrackerApp* app = combo_app_alloc();
    view_dispatcher_run(app->view_dispatcher);

    combo_app_free(app);
    return 0;
}
