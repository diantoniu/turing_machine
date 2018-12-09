var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
script.onreadystatechange = handler;
script.onload = handler;
head.appendChild(script);

function handler() {
    var states_from = [];
    var states_to = [];
    var states = [];
    var procedure = [];
    var turing_process = [];
    var exact_lines_of_code = [];
    var input = [];
    var lambda = 'λ';
    var add_lambdas = 1000;
    var tape_index = add_lambdas;
    var is_playing = false;
    var is_paused = false;
    var current_state_position = 0;
    var current_timeout;
    var slowest_speed = 2000;
    var repaint_speed = 2000;
    var move_persent = 0.6;
    var move_speed = repaint_speed * move_persent;
    var speed_bar = document.getElementById("speed_bar");
    var rewind = document.getElementById("rewind");
    var time_status_demo = 1000;

    page_load(); // initialize turing tape container by lambda
    /*
     make all buttons disabled while code is not compiled
     */
    code_not_compiled();

    $("#code_input").click(function () {
        $("#status_container").empty();

        code_str = $('#code_container').val();
        states_from = [];
        states_to = [];
        $.ajax({
            url: 'code_handler',
            data: {
                'code': JSON.stringify(code_str),
            },
            success: function (result) {
                res = jQuery.parseJSON(result);
                states_from = res[0];
                states_to = res[1];
                exact_lines_of_code = res[2];
                if (input.length != 0) {
                    //it means that we loaded input before code compile, so we have to count states, procedure, turing_process
                    count_turing_data();
                }
                code_compiled();
            },
            error: function (result) {
                reset_status_container_by_error(result.responseText)
                code_not_compiled();
            }

        });
    });
    $('#code_container').on('input', function () {
        put_status_disable_icon("(current code is not compiled)");

    });
    $("#load_input").click(function () {
        if (($('#load').val()).length == 0) {
            page_load();
            input_not_loaded();
            return;
        }
        if (is_playing == true || is_paused == true) {
            return;
        }
        handle_input($('#load').val());
        count_turing_data();
        paint_original_tape(); // not states[0] because it could be not counted
        current_state_position = 1; // because we alseady painted stated[current_state_position = 0] with paint_original_tape()
        set_rewind_to_zero();
        input_loaded();
    });

    $("#play").click(function () {
        if (is_playing == true) {
            return;
        }
        is_playing = true;
        is_paused = false;
        out_current_state(current_state_position - 1);
        current_timeout = setTimeout(go, 700, current_state_position);
    });
    $("#stop").click(function () {
        is_playing = false;
        is_paused = false;
        clearTimeout(current_timeout)
        paint_original_tape();
        current_state_position = 1; // because we alseady painted stated[current_state_position = 0] with paint_original_tape()
        set_rewind_to_zero();
        reset_current_state();
    });
    $("#pause").click(function () {
        if (is_playing == false) {
            return;
        }
        is_paused = true;
        is_playing = false;
        clearTimeout(current_timeout)

    });
    $("#speed_bar").click(function () {
        repaint_speed = slowest_speed - parseInt($('#speed_bar').val());
        move_speed = repaint_speed * move_persent;
    });
    speed_bar.addEventListener("input", function () {
        repaint_speed = slowest_speed - parseInt($('#speed_bar').val());
        move_speed = repaint_speed * move_persent;
    }, false);

    $("#rewind").mousedown(function () {
        clearTimeout(current_timeout);
    });
    $("#rewind").mouseup(function () {
        current_state_position = parseInt($('#rewind').prop('value')) + 1;
        if (is_paused == false) {
            current_timeout = setTimeout(go, 700, current_state_position);
        }
    });
    rewind.addEventListener("input", function () {
        st_index = parseInt($('#rewind').prop('value'));
        out_current_state(st_index);
        paint_tape_by_state(st_index);
    }, false);

    $("#status_container").on("click", "#close_container_status", function () {
        $("#status_container").empty();
    });

    function re_paint_tape(state_index) { //we should repaint all exept 2 col in head and exept 2 col in tail, it works with state_index >= 1
        var content = "<table class='turing_tape'><tr>";
        if (procedure[state_index - 1][2] == 'R') {
            content = "<table class='turing_tape' style = 'margin-left: -45px;'><tr>";
        } else if (procedure[state_index - 1][2] == 'L') {
            content = "<table class='turing_tape' style = 'margin-left: -145px;'><tr>";
        }
        for (var i = 0; i < states[state_index].length; i++) {
            content += '<td>' + states[state_index][i] + '</td>';
        }
        content += "</tr></table>"
        $("#container").empty();
        $('#container').append(content);

        if (procedure[state_index - 1][2] == 'R') {
            move_tape_right("50px", move_speed);
        }
        else if (procedure[state_index - 1][2] == 'L') {
            move_tape_left("50px", move_speed);
        }
    }

    function paint_original_tape() { // function that just paint original tape with shift
        if (input.length == 0) {
            return;
        }
        var content = "<table class='turing_tape'><tr>"
        for (var i = tape_index - 9; i < tape_index + 10; i++) {
            content += '<td>' + input[i] + '</td>';
        }
        content += "</tr></table>"
        $("#container").empty();
        $('#container').append(content);
    }

    function paint_tape_by_state(state_index) { // // function paint tape on given state
        var content = "<table class='turing_tape'><tr>"
        for (var i = 0; i < states[state_index].length; i++) {
            content += '<td>' + states[state_index][i] + '</td>';
        }
        content += "</tr></table>"
        $("#container").empty();
        $('#container').append(content);
    }

    function go(i) { // work onlu with i >= 1
        if (i >= states.length) {
            is_playing = false;
            is_paused = false;
            return;
        }
        is_playing = true;
        out_current_state(i);
        re_paint_tape(i);
        increase_rewind(1);
        current_state_position = i + 1;
        current_timeout = setTimeout(go, repaint_speed, current_state_position);
    }

    function count_turing_data() {
        procedure = [];
        turing_process = [];
        states = [];
        var input_copy = input.slice();
        var continue_calculations = true;
        var input_iterator = add_lambdas;
        var current_q_state = 0;
        var counter = 0;
        states.push(input_copy.slice(input_iterator - 9, input_iterator + 10));
        while (continue_calculations) {
            counter += 1;
            if (counter >= add_lambdas) {
                continue_calculations = false;
            }
            for (var i = 0; i < states_from.length; i++) {
                current_from_state = states_from[i];
                if (current_from_state[0] == current_q_state && current_from_state[1] == input_copy[input_iterator]) {
                    current_to_state = states_to[i];
                    turing_process.push([current_from_state, current_to_state])
                    if (current_to_state.length == 1) {
                        input_copy[input_iterator] = current_to_state[0];
                        procedure.push([input_iterator, input[input_iterator], 'N']);
                        continue_calculations = false;
                    } else {
                        current_q_state = current_to_state[0];
                        input_copy[input_iterator] = current_to_state[1];
                        procedure.push([input_iterator, input_copy[input_iterator], current_to_state[2]]);
                        if (current_to_state[2] == 'R') {
                            input_iterator = input_iterator + 1;
                        } else if (current_to_state[2] == 'L') {
                            input_iterator = input_iterator - 1;
                        }
                    }
                    states.push(input_copy.slice(input_iterator - 9, input_iterator + 10));
                    break;
                }
            }
        }
        set_max_val_to_rewind(procedure.length)
    }

    function handle_input(input_str) {
        input = []
        for (var i = 0; i < input_str.length; i++) {
            input.push(input_str[i]);
        }
        shift_input();
    }

    function shift_input() {
        for (var i = 0; i < add_lambdas; i++) {
            input.unshift(lambda);
            input.push(lambda);
        }
    }

    function move_tape_left(shift, dur) {
        $(".turing_tape").animate({
            left: shift
        }, {
            duration: dur
        });
    };

    function move_tape_right(shift, dur) {
        $(".turing_tape").animate({
            right: shift
        }, {
            duration: dur
        });
    };

    function page_load() {
        /*
         initialize tape with lambla according to tape size
         -9 +10
         */
        var content = "<table class='turing_tape'><tr>"
        for (var i = tape_index - 90; i < tape_index + 100; i++) {
            content += '<td>' + lambda + '</td>';
        }
        content += "</tr></table>"
        $("#container").empty();
        $('#container').append(content);
    }

    function code_not_compiled() {
        disable_play();
        disable_pause();
        disable_stop();
        disable_load_input();
        put_status_disable_icon("(current code is not compiled or have invalid syntax)");
    }

    function code_compiled() {
        enable_load_input();
        put_status_enable_icon();
    }

    function input_loaded() {
        enable_play();
        enable_pause();
        enable_stop();
    }

    function input_not_loaded() {
        disable_play();
        disable_pause();
        disable_stop();
    }

    function set_max_val_to_rewind(max_val) {
        $('#rewind').prop({
            'max': max_val
        });
    }

    function increase_rewind(val) {
        $('#rewind').prop({
            'value': parseInt($('#rewind').prop('value')) + val,
        });
    }

    function increase_rewind(val) {
        $('#rewind').prop({
            'value': parseInt($('#rewind').prop('value')) + val,
        });
    }

    function set_rewind_to_zero() {
        $('#rewind').prop({
            'value': 0,
        });
    }

    function out_current_state(current_st) {
        if (current_st >= turing_process.length) {
            console.log("(turing process)out_current_state : turing_process length less then asked")
            return;
        }
        var curr_tur_process = turing_process[current_st][0];
        var content = "<p class='text-box-subhead'>" + 'q' + curr_tur_process[0] + curr_tur_process[1] + "</p>";
        $("#current_state").empty();
        $('#current_state').append(content);
    }

    function reset_current_state() {
        $("#current_state").empty();
    }

    function reset_status_container_by_error(message) {
        var content = "<div class='alert alert-danger' id = 'my'><strong> Error! </strong>" + message;
        content += "<a class='close-classic' id='close_container_status'></a>";
        content += "</div >";
        $("#status_container").empty();
        $('#status_container').append(content);
    }

    function append_script() {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "jquery-linedtextarea.js";
        document.head.appendChild(script);
    }

    function disable_play() {
        $("#play").prop("disabled", true);
    }

    function disable_pause() {
        $("#pause").prop("disabled", true);
    }

    function disable_stop() {
        $("#stop").prop("disabled", true);
    }

    function disable_load_input() {
        $("#load_input").prop("disabled", true);
    }

    function disable_code_input() {
        $("#code_input").prop("disabled", true);
    }

    function enable_play() {
        $("#play").prop("disabled", false);
    }

    function enable_pause() {
        $("#pause").prop("disabled", false);
    }

    function enable_stop() {
        $("#stop").prop("disabled", false);
    }

    function enable_load_input() {
        $("#load_input").prop("disabled", false);
    }

    function enable_code_input() {
        $("#code_input").prop("disabled", false);
    }

    function put_status_enable_icon() {
        var content = "<i class='icono-checkCircle'></i>"
        $("#icono_status_container").empty();
        $('#icono_status_container').append(content);
    }

    function put_status_disable_icon(message) {
        var content = "<i class='icono-crossCircle'></i>" + message;
        $("#icono_status_container").empty();
        $('#icono_status_container').append(content);
    }

    function put_status_redu_icon() {
        var content = "<i class='icono-sync'></i>"
        $("#icono_status_container").empty();
        $('#icono_status_container').append(content);
    }

    function add_copiled_code_to_container() {
        var content = "";
        for (var i = 0; i < states_from.length; i++) {
            if (states_to[i].length == 1) {
                content += "<p> q" + states_from[i][0] + "" + states_from[i][1] + "→ q*" + states_to[i][0] + "</p>";
            } else {
                content += "<p> q" + states_from[i][0] + "" + states_from[i][1] + "→ q" + states_to[i][0] +
                    "" + states_to[i][1] + "" + states_to[i][2] + "</p>";
            }
        }
        $("#compiled_code_container").empty();
        $('#compiled_code_container').append(content);

    }


}