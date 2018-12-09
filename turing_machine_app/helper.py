import re


def get_splitted_array(str):  # split string by '\n' and return array of strings
    splitted_array = str.split('\n')
    new_arr = [];
    for i in splitted_array:
        new_arr.append(re.sub(r'\s+', '', i));
    return new_arr


def handle_line(line):  # handle each line by search '→' symbol, break line on before, after (before → after)
    start = ""
    end = ""
    for i in range(0, len(line)):
        if line[0] == '/' and len(line) > 1 and line[1] == '/':  # comment
            continue
        if (line[i] == '→'):
            start = handle_start(line[0: i])
            end = handle_end(get_end(line[i + 1: len(line)]))
            if (start != False and end != False):
                return [start, end]
    return False;


def get_end(end):  # end coud be in correct form but with comment, this function separate end from comment
    for i in range(0, len(end)):
        if end[i] == '/' and i < len(end) - 1 and end[i + 1] == '/':  # found comment from i to end(len)
            return end[0: i]
    return end


def handle_start(start):  # return array[state(int), symbol] in case of correct input and False in other case
    if check_start(start) == True:
        return [int(start[1: len(start) - 1]), start[len(start) - 1]]
    return False


def handle_end(end):
    if check_end(end) == True:
        if (len(end) == 3):  # end state
            return [end[len(end) - 1]]
        return [int(end[1: len(end) - 2]), end[len(end) - 2], end[len(end) - 1]]
    return False  # return array[state(int), symbol, (R, L)] or array [symbol] in case of correct input and False in other case


def check_start(start):
    if ((len(start) < 3) or (start[0] != 'q')):
        return False
    try:
        int(start[1: len(start) - 1])
    except ValueError:
        return False
    return True  # return True in case of correct input and False in other case


def check_end(end):
    if (len(end) < 3) or (end[0] != 'q'):
        return False
    if len(end) == 3:  # it means that it is end state => (q)(*)(symbol)
        if end[len(end) - 2] != '*':
            return False
        return True
    if (end[len(end) - 1] != 'R') and (end[len(end) - 1] != 'L'):
        return False
    try:
        int(end[1: len(end) - 2])
    except ValueError:
        return False
    return True  # return True in case of correct input and False in other case


def code_parser(str):  # parse str and return array [states_from, states_to]
    splitted_array = get_splitted_array(str)
    states_from = [];
    states_to = [];
    exact_lines_of_code = [];
    counter = 1;
    for i in splitted_array:
        if len(i) != 0:
            from_to = handle_line(i);
            if from_to != False:
                states_from.append(from_to[0])
                states_to.append(from_to[1])
                exact_lines_of_code.append(counter)
            else:
                return [False, counter];
        counter += 1
    return [states_from, states_to, exact_lines_of_code]
