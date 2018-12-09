# import ahocorasick

def check_is_end_state(str): #returns True is it is end state or False in another case
    if len(str) > 0 and str[len(str) - 1] == "●": # ● - end symbol
        return True
    return False

def get_to_state(str): #returns state without end symbol if it exists
    if check_is_end_state(str) == True:
        return str[:-1];
    return str


def run_code(states, input):
    from_states = states[0]
    to_states = states[1]

    counter = 0
    unic_states = set()
    unic_states.add(input) # add to unic set first possible state of str

    result_states = []
    result_states.append(input) # add to result set first possible state of str

    rule_consequense = []

    is_end = False
    cycled = False
    exceeded_am_st = False

    while is_end == False and cycled == False and exceeded_am_st == False:
        if (counter > 1000) or (len(result_states[(len(result_states) - 1)]) > 100):
            exceeded_am_st = True
        for i in range(0, len(from_states)):
            if input.find(from_states[i]) != -1:
               input = input.replace(from_states[i], get_to_state(to_states[i]), 1)
               result_states.append(input)
               rule_consequense.append(from_states[i] + "→" + to_states[i]);
               if (check_is_end_state(to_states[i])):
                   is_end = True
               if (input in unic_states):
                   cycled = True
               else :
                   unic_states.add(input)
               break;
            if i == (len(from_states) - 1): # we did not find suitable rule - so it is the end
                is_end = True;
        counter += 1;
    return [is_end, cycled, exceeded_am_st, result_states, rule_consequense]
