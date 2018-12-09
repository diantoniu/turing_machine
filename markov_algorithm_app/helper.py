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
            return "comment"
        if (line[i] == '→'):
            start = handle_start(line[0: i])
            end = handle_end(get_end(line[i + 1: len(line)]))
            if (start != False and end != False):
                return [start, end]
    return False


def get_end(end):  # end coud be in correct form but with comment, this function separate end from comment
    for i in range(0, len(end)):
        if end[i] == '/' and i < len(end) - 1 and end[i + 1] == '/':  # found comment from i to end(len)
            return end[0: i]
    return end


def handle_start(start):  # return array[state(int), symbol] in case of correct input and False in other case
    if check_start(start) == True:
        return start
    return False


def handle_end(end):
    if check_end(end) == True:  # could be the situation when kk -> p●p
        return end
    return False


def check_start(start):
    if (len(start) < 1):
        return False
    return True  # return True in case of correct input and False in other case


def check_end(end):  # returns True is it is end state and it correct or False in another case
    for i in range(0, len(end)):
        if end[i] == '●' and i != (len(end) - 1):  # ● - end symbol
            return False;
    return True


def code_parser(str):  # parse str and return array [states_from, states_to]
    splitted_array = get_splitted_array(str)
    states_from = [];
    states_to = [];
    counter = 1;
    for i in splitted_array:
        if len(i) != 0:
            from_to = handle_line(i);
            if from_to == False:
                return [False, counter]
            elif from_to != "comment":
                states_from.append(from_to[0])
                states_to.append(from_to[1])
        counter += 1
    return [states_from, states_to]
