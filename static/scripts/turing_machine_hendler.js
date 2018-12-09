var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
head.appendChild(script);

window.onload = function () {
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
    var saved_algorithms = {};
    var current_status = ''
    /*
     maximum we have 1000 len(input) 1000 elements
     but changing before after entails changing of margins when tape is displaying and changing of len while tape move
     */
    var max_display_cells = 1000;
    var display_cells = 5; // r = display_cells - 2, l = display_cells - 1
    var cells_spacing = 5;

    page_load(); // initialize turing tape container by lambda
    /*
     make all buttons disabled while code is not compiled
     */
    code_not_compiled();
    $.ajax({
        url: "get",
        dataType: "json",
        success: function (data) {
            for (var i in data) {
                saved_algorithms[data[i]['title']] = data[i]['algorithm'];
                $('#algorithms').append($('<option>', {
                    value: data[i]['title'],
                    text: data[i]['title']
                }));
            }
        }
    });

    $("#algorithms").change(function () {
        console.log("bla");
        selected_element = document.getElementById("algorithms").value;
        if (selected_element === "Examples") {
            $("#remove_example").prop("disabled", true);
        } else {
            $("#remove_example").prop("disabled", false);
        }

        selected_code = saved_algorithms[selected_element];
        if (selected_element == "Examples") {
            selected_code = "";
        }
        document.getElementById("code_container").value = selected_code;
    });

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

    $("#save_code").click(function () {
        title = myFunction();
        if (!title) {
            return;
        }
        if ($("#algorithms option[value=" + title + "]").length > 0) { // title already exist
            alert("Code was NOT saved. Plaese specify another name");
            return;
        }
        code_str = $('#code_container').val();
        add_element_to_algorithms(title, code_str);

        $.ajax({
            url: 'save',
            data: {
                'title': JSON.stringify(title),
                'code': JSON.stringify(code_str),
            },
            success: function (result) {
                console.log("success")
            },
            error: function (result) {
                console.log("error")
            }

        });
    });
    $('#code_container').on('input', function () {
        put_status_disable_icon("Compile your code.");

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

    $("#container").on("click", "#zoom_in", function () {
        zoom(-1);
    });
    $("#container").on("click", "#zoom_out", function () {
        zoom(1);
    });


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

    function paint_tape(elements, shift_side) {
        if (elements.length < 10) alert("Too few elements to display.");

        var tot_width = $("#container").width();
        var n = elements.length;
        var cell_width = parseInt((tot_width - cells_spacing * (n - 4)) / (n - 4) + 1);
        var whole_line = n * (cell_width + cells_spacing) + cells_spacing;
        var shift = (whole_line - tot_width) / 2;

        if (shift_side == 'R') {
            shift -= cell_width + cells_spacing;
        }
        else if (shift_side == 'L') {
            shift += cell_width + cells_spacing;
        }

        content = "<table class='turing_tape' style = 'margin-left:" + (-shift) + "px;'><tr>";
        for (var i = 0; i < elements.length; i++) {
            content += "<td style='width: " + cell_width + "px; min-width: " + cell_width + "px;'>" + elements[i] + "</td>";
        }
        content += "</tr></table>"


        var itm = $("#container");
        var zoom = itm.children('.turing_container_zoom');
        itm.empty();
        itm.append(zoom);
        itm.append(content);


        // $("#container").empty();
        // $('#container').append(content);
        change_tape_text_size(cell_width);
        return cell_width + cells_spacing;
    }

    function re_paint_tape(state_index) { //we should repaint all exept 2 col in head and exept 2 col in tail, it works with state_index >= 1
        var n = max_display_cells;
        var elements_to_display = states[state_index].slice(n - display_cells, n + display_cells + 1);

        var shift = paint_tape(elements_to_display, procedure[state_index - 1][2]); // element size

        if (procedure[state_index - 1][2] == 'R') {
            setTimeout(move_tape_right, (0.95 - move_persent) * repaint_speed, shift + "px", move_speed);
        }
        else if (procedure[state_index - 1][2] == 'L') {
            setTimeout(move_tape_left, (0.95 - move_persent) * repaint_speed, shift + "px", move_speed);
        }
    }

    function paint_original_tape() { // function that just paint original tape with shift
        if (input.length == 0) {
            return;
        }
        var n = max_display_cells;
        var elements_to_display = input.slice(n - display_cells, n + display_cells + 1);
        paint_tape(elements_to_display, 'N');
    }

    function paint_tape_by_state(state_index) { // function paint tape on given state
        if (states.length == 0) {
            page_load();
            return;
        }
        var n = max_display_cells;
        var elements_to_display = states[state_index].slice(n - display_cells, n + display_cells + 1);
        paint_tape(elements_to_display, 'N');
    }

    function page_load() {
        /*
         initialize tape with lambla according to tape size
         */
        paint_tape(Array(2 * display_cells + 1).fill(lambda), 'N');
    }

    function go(i) { // work onlu with i >= 1
        if (i >= states.length) {
            is_playing = false;
            is_paused = false;
            return;
        }
        is_playing = true;
        out_current_state(i - 1);
        re_paint_tape(i);
        increase_rewind(1);
        current_state_position = i + 1;
        current_timeout = setTimeout(go, repaint_speed, current_state_position);
    }

    /*
     here to change len // done!
     */
    function count_turing_data() {
        procedure = [];
        turing_process = [];
        states = [];
        var input_copy = input.slice();
        var continue_calculations = true;
        var input_iterator = add_lambdas;
        var current_q_state = 0;
        var counter = 0;
        /*
         here change -9 + 10
         */
        states.push(input_copy.slice(input_iterator - max_display_cells, input_iterator + max_display_cells + 1));
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
                    states.push(input_copy.slice(input_iterator - max_display_cells, input_iterator + max_display_cells + 1));
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

    function code_not_compiled() {
        disable_play();
        disable_pause();
        disable_stop();
        disable_load_input();
        disable_rewind();
        put_status_disable_icon("Compile your code.");
    }

    function code_compiled() {
        enable_load_input();
        put_status_enable_icon("Compiled.");
    }

    function input_loaded() {
        enable_play();
        enable_pause();
        enable_stop();
        enable_rewind();
    }

    function input_not_loaded() {
        disable_play();
        disable_pause();
        disable_stop();
        d
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

    function disable_rewind() {
        $("#rewind").prop("disabled", true);
    }

    function disable_play() {
        $("#play").prop("disabled", true);
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

    function enable_rewind() {
        $("#rewind").prop("disabled", false);
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

    function put_status_enable_icon(message) {
        current_status = message;
        $("#icon_status").removeClass().addClass("masterTooltip_status_icon icono-checkCircle");
    }

    function put_status_disable_icon(message) {
        current_status = message;
        $("#icon_status").removeClass().addClass("masterTooltip_status_icon icono-crossCircle");
    }

    function change_tape_text_size(size) {
        if (size >= 30) {
            size = 30;
        }
        $(".turing_tape td ").css("font-size", size.toString() + "px");
    }

    function zoom(val) {
        if (val < 0) {
            if (display_cells < 6) {
                return;
            }
        }
        if (val > 0) {
            if (display_cells > 50) {
                return;
            }
        }
        display_cells = display_cells + val;
        if (is_playing == false) {
            paint_tape_by_state(current_state_position - 1)
        }
    }

    function myFunction() {
        var txt;
        var title = prompt("Enter the titile:");
        if (title == null || title == "") {
            return false;
        } else {
            return title;
        }
        document.getElementById("demo").innerHTML = txt;
    }

    function add_element_to_algorithms(title, algorithm) {
        saved_algorithms[title] = algorithm;
        $('#algorithms').append($('<option>', {
            value: title,
            text: title
        }));
        $("#algorithms").val(title).change();

    }

    function get_mail_address(text) {
        var txt;
        var address = prompt(text);
        if (address == null || address == "" || !validate_mail(address)) {
            return false;
        } else {
            return address;
        }
    }

    function validate_mail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    jQuery.fn.extend({
        insertAtCaret: function (myValue) {
            return this.each(function (i) {
                if (document.selection) {
                    //For browsers like Internet Explorer
                    this.focus();
                    var sel = document.selection.createRange();
                    sel.text = myValue;
                    this.focus();
                }
                else if (this.selectionStart || this.selectionStart == '0') {
                    //For browsers like Firefox and Webkit based
                    var startPos = this.selectionStart;
                    var endPos = this.selectionEnd;
                    var scrollTop = this.scrollTop;
                    this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
                    this.focus();
                    this.selectionStart = startPos + myValue.length;
                    this.selectionEnd = startPos + myValue.length;
                    this.scrollTop = scrollTop;
                } else {
                    this.value += myValue;
                    this.focus();
                }
            });
        }
    });
    $('#arrow').click(function () {
        $('#code_container').insertAtCaret('→');
    })
    $('#lambda').click(function () {
        $('#code_container').insertAtCaret('λ');
    })


// Get the modal
    var modal = document.getElementById('myModal');

// Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
    $('#send').click(function () {
        var content = code_str = $('#code_container').val();
        var areaValue = $('#modal_mail').val();
        $('#modal_mail').val(areaValue + content);
        modal.style.display = "block";

    })

// When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
        clear_modal();
    }
    //
    $('#modal_send').click(function () {
        var to = $('#modal_to').val();
        var topic = $('#modal_topic').val();
        var code = $('#modal_mail').val();

        send_mail(to, topic, code)
    })

    $("#modal_to").on('input', function () {
        var mail = $('#modal_to').val();
        if (validate_mail(mail)) {
            $('#modal_to').css("border", "solid green");
        } else if (mail == "") {
            $('#modal_to').css("border", "none");
            $('#modal_to').css("border-bottom", "1px solid #ccc");
        } else {
            $('#modal_to').css("border", "solid red");
        }
    });
    function send_mail(to, topic, code) {
        var mail = to;
        if (mail == null || mail == "" || !validate_mail(mail)) {
            alert("Input correct mail");
        } else {
            $.ajax({
                url: 'send_turing',
                data: {
                    'mail': JSON.stringify(mail),
                    'topic': JSON.stringify(topic),
                    'code': JSON.stringify(code),
                },
                success: function (result) {
                    modal.style.display = "none";
                    alert("Mail sent");
                    clear_modal();
                },
                error: function (result) {
                    alert("Error. Check inputed data")
                }

            });
        }

        console.log(to)
        console.log(topic)
        console.log(code)

    }

// When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    function clear_modal() {
        $('#modal_to').val('');
        $('#modal_topic').val('');
        $('#modal_mail').val('');
        $('#modal_to').css("border", "none");
        $('#modal_to').css("border-bottom", "1px solid #ccc");
    }

    $("#remove_example").click(function () {
        selected_element = document.getElementById("algorithms").value;
        if (selected_element != "Examples") {
            $("#remove_example").prop("disabled", true);
            $('.my_tooltip').remove(); // disable button for remove
            $("#algorithms option[value='" + selected_element + "']").remove();
            delete saved_algorithms[selected_element];
            $.ajax({
                url: 'remove_from_examples',
                data: {
                    'example': JSON.stringify(selected_element),
                },
                success: function (result) {
                    console.log("removed from algorithms.")
                },
                error: function (result) {
                    alert("error while remove element from algorithms.")
                }
            });
        }
    });

    $('.masterTooltip').mouseenter(function (e) {
        title = "Remove \"" + document.getElementById("algorithms").value + "\" from saved.";
        $('<p class="my_tooltip"></p>')
            .text(title)
            .appendTo('body')
            .fadeIn('slow');
    }).mousemove(function (e) {
        var mousex = e.pageX + 10; //Get X coordinates
        var mousey = e.pageY + 20; //Get Y coordinates
        $('.my_tooltip').css({top: mousey, left: mousex})
    }).mouseout(function (e) {
        $('.my_tooltip').remove();
    });

    $(".masterTooltip_status_icon").on('mouseenter', function (e) {
        title = current_status;
        $('<p class="my_tooltip"></p>')
            .text(title)
            .appendTo('body')
            .fadeIn('slow');
    }).mousemove(function (e) {
        var mousex = e.pageX + 10; //Get X coordinates
        var mousey = e.pageY + 20; //Get Y coordinates
        $('.my_tooltip').css({top: mousey, left: mousex})
    }).mouseout(function (e) {
        $('.my_tooltip').remove();
    });

}


