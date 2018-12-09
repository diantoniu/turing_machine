var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
head.appendChild(script);

window.onload = function () {
    var states_from = [];
    var states_to = [];
    var states = []; // state[0] - original state
    var current_state_position = 0;
    var current_timeout;
    var rule_consequense = []
    var is_playing = false;
    var is_paused = false;
    var was_played = false;
    var slowest_speed = 5000;
    var time_status_demo = 5000;
    var speed_bar = document.getElementById("speed_bar");
    var rewind = document.getElementById("rewind");
    var increase_rew_val = 0;
    var slide_up_history = false;
    var slide_up_code_history = false;
    var pre_markov_container_font = 30;
    var markov_container_font = 30;
    var after_markov_container_font = 30;
    var font_b = 1;
    var current_status = ''

    var saved_algorithms = {};
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
        },
        error: function (data) {
            console.log("error")
        }
    });

    $("#algorithms").change(function () {
        selected_element = document.getElementById("algorithms").value;
        selected_code = saved_algorithms[selected_element];
        if (selected_element == "Examples") {
            selected_code = "";
            $("#remove_example").prop("disabled", true);
        } else {
            $("#remove_example").prop("disabled", false);
        }
        document.getElementById("code_container").value = selected_code;
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
    // $("#send").click(function () {
    //     mail = get_mail_address("Please enter your mail address:");
    //     console.log(mail);
    //     if (!mail) {
    //         alert("Enter correct mail address, please.")
    //         return;
    //     }
    //     code_str = $('#code_container').val();
    //     $.ajax({
    //         url: 'send_markov',
    //         data: {
    //             'mail': JSON.stringify(mail),
    //             'code': JSON.stringify(code_str),
    //         },
    //         success: function (result) {
    //             console.log("success")
    //         },
    //         error: function (result) {
    //             console.log("error")
    //         }
    //
    //     });
    // });

    $("#code_input").click(function () {
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
                code_compiled();
            },
            error: function (result) {
                reset_status_container_by_error(result.responseText)
                code_not_compiled();
            }

        });
    });
    $("#load_input").click(function () {
        input = $('#load').val();
        if (is_playing || is_paused) {
            reset_status_container_by_info("Before uploading a new example, you must wait for the current one to finish or stop it.")
            return;
        }
        $.ajax({
            url: 'load_handler',
            data: {
                'input': JSON.stringify(input),
                'states': JSON.stringify([states_from, states_to]),
            },
            success: function (result) {

                //is_end, cycled, exceeded_am_st, result_states,
                res = jQuery.parseJSON(result);
                states = res[3];
                rule_consequense = res[4];
                console.log(states)
                console.log(rule_consequense)
                init_pre_markov_container(states[0]);
                init_markov_container("*"); // the rule
                init_after_markov_container("*");
                input_loaded();
                handle_serv_answ(res);
            },
            error: function (result) {
                alert("ERROR OF LOAD DATA!");
            }

        });
    });
    $("#play").click(function () {
        if (is_playing) {
            console.log("is play already")
            return;
        }

        was_played = true;
        is_playing = true;
        is_paused = false;
        run_algorithm();
    });
    $("#stop").click(function () {
        if (!was_played) {
            console.log("is was not played already")
            return;
        }
        empty_status_container();
        reset_indicators();
        reset_history_container();
        reset_code_history_container();
        set_rewind_to_zero();
        reset_state_position();
        paint_start_state();
        clearTimeout(current_timeout)
    });
    $("#pause").click(function () {
        if (!is_playing) {
            console.log("is not play now")
            return;
        }

        is_paused = true;
        is_playing = false;
        clearTimeout(current_timeout)
    });

    $("#rewind").mousedown(function () {
        clearTimeout(current_timeout);
    });
    $("#rewind").mouseup(function () {
        console.log(current_state_position)
        current_state_position = parseInt($('#rewind').prop('value'));
        if (current_state_position >= rule_consequense.length - 1) {
            reset_indicators();
            return;
        }
        if (is_paused == false) {
            run_algorithm();
        }
    });

    $("#pre_markov_container").on("click", "#pre_markov_container_zoom_out", function () {
        pre_markov_container_zoom(-font_b);
    });
    $("#pre_markov_container").on("click", "#pre_markov_container_zoom_in", function () {
        pre_markov_container_zoom(font_b);
    });

    $("#markov_container").on("click", "#markov_container_zoom_out", function () {
        markov_container_zoom(-font_b);
    });
    $("#markov_container").on("click", "#markov_container_zoom_in", function () {
        markov_container_zoom(font_b);
    });
    $("#after_markov_container").on("click", "#after_markov_container_zoom_out", function () {
        after_markov_container_zoom(-font_b);
    });
    $("#after_markov_container").on("click", "#after_markov_container_zoom_in", function () {
        after_markov_container_zoom(font_b);
    });

    rewind.addEventListener("input", function () {
        current_state_position = parseInt($('#rewind').prop('value'));
        paint_history();
        paint_code_history();
        st_index = parseInt($('#rewind').prop('value'));
        paint_algorithm(st_index);
    }, false);

    $('#code_container').on('input', function () {
        put_status_disable_icon("Compile your code.");
    });

    $("#status_container").on("click", "#close_container_status", function () {
        $("#status_container").empty();
    });

    $("#speed_bar").mouseup(function () {
        time_status_demo = slowest_speed - parseInt($('#speed_bar').val());
    });
    speed_bar.addEventListener("input", function () {
        time_status_demo = slowest_speed - parseInt($('#speed_bar').val());
    }, false);

    $("#history_head").click(function () {
        if (!slide_up_history) {
            $("#history_container").slideUp();
            slide_up_history = true;
        } else {
            $("#history_container").slideDown();
            scroll_down_history_container();
            slide_up_history = false;
        }
    });
    $("#code_history_head").click(function () {
        if (!slide_up_code_history) {
            $("#code_history_container").slideUp();
            slide_up_code_history = true;
        } else {
            $("#code_history_container").slideDown();
            scroll_down_code_history_container();
            slide_up_code_history = false;
        }
    });

    function code_compiled() {
        enable_load_input();
        empty_status_container();
        put_status_enable_icon("Compiled.");
    }


    function code_not_compiled() {
        disable_play();
        disable_pause();
        disable_stop();
        disable_load_input();
        disable_rewind()
        put_status_disable_icon("Compile your code.");
    }


    function reset_status_container_by_error(message) {
        var content = "<div class='alert alert-danger'><strong> Error! </strong>" + message;
        content += "<a class='close-classic' id='close_container_status'></a>";
        content += "</div >";
        $("#status_container").empty();
        console.log("eerror")
        $('#status_container').append(content);
    }

    function reset_status_container_by_info(message) {
        var content = "<div class='alert alert-info'><strong> Warning! </strong>" + message;
        content += "<a class='close-classic' id='close_container_status'></a>";
        content += "</div >";
        $("#status_container").empty();
        $('#status_container').append(content);
    }

    function handle_serv_answ(res) {
        console.log(res)
        //is_end, cycled, exceeded_am_st, result_states,
        console.log(res[1])
        if (res[1] == true) {
            console.log("hii")
            reset_status_container_by_error("Compiled code can be looped. The state mapping is partial.")
            return;
        }
        if (res[2] == true) {
            reset_status_container_by_error("The program exceeds the allowed number of steps. The state mapping is partial.")
            return;
        }

    }


    function empty_status_container() {
        $("#status_container").empty();
    }

    function enable_load_input() {
        $("#load_input").prop("disabled", false);
    }

    function disable_play() {
        $("#play").prop("disabled", true);
    }

    function disable_rewind() {
        $("#rewind").prop("disabled", true);
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
        console.log("enable")
        $("#play").prop("disabled", false);
    }

    function enable_rewind() {
        $("#rewind").prop("disabled", false);
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

    function init_markov_container(message) {
        var content = "<p class='markov_container_p'>" + message + "</p>";
        var itm = $('#markov_container');
        var zoom = itm.children('.markov_container_zoom');
        itm.empty();
        itm.append(zoom);
        itm.append(content);
        // $("#markov_container").empty();
        // $('#markov_container').append(content);
    }

    function init_pre_markov_container(message) {
        var content = "<p class='markov_container_p'>" + message + "</p>";
        var itm = $('#pre_markov_container');
        var zoom = itm.children('.markov_container_zoom');
        itm.empty();
        itm.append(zoom);
        itm.append(content);
    }

    function init_after_markov_container(message) {
        var content = "<p class='markov_container_p'>" + message + "</p>";
        var itm = $('#after_markov_container');
        var zoom = itm.children('.markov_container_zoom');
        itm.empty();
        itm.append(zoom);
        itm.append(content);
        // $("#after_markov_container").empty();
        // $('#after_markov_container').append(content);
    }

    function put_status_enable_icon(message) {
        current_status = message;
        $("#icon_status").removeClass().addClass("masterTooltip_status_icon icono-checkCircle");
        // var content = "<i class='icono-checkCircle'></i>" + message;
        // $("#icono_status_container").empty();
        // $('#icono_status_container').append(content);
    }

    function put_status_disable_icon(message) {
        current_status = message;
        $("#icon_status").removeClass().addClass("masterTooltip_status_icon icono-crossCircle");
        // var content = "<i class='icono-crossCircle'></i>" + message;
        // $("#icono_status_container").empty();
        // $('#icono_status_container').append(content);
    }

    function input_loaded() {
        was_played = false;
        reset_indicators();
        reset_state_position();
        reset_history_container();
        reset_code_history_container();
        empty_status_container();
        set_rewind_to_zero();
        set_max_val_to_rewind(rule_consequense.length - 1);
        enable_play();
        enable_pause();
        enable_stop();
        enable_rewind();
    }

    function paint_algorithm(rule_num) {
        if (rule_num > (rule_consequense.length - 1)) {
            pre = states[rule_num];
            rule = "*";
            after = "*";
        } else {
            pre = states[rule_num];
            rule = rule_consequense[rule_num];
            if (rule_num + 1 > (states.length - 1)) {
                alert("ERROR TO PAINT!");
                return;
            }
            after = states[rule_num + 1];
        }
        init_pre_markov_container(pre);
        init_markov_container(rule); // the rule
        init_after_markov_container(after);
        paint_history();
        paint_code_history();
    }

    function paint_start_state() {
        pre = states[0];
        rule = "*";
        after = "*";
        init_pre_markov_container(pre);
        init_markov_container(rule);
        init_after_markov_container(after);
    }

    function paint_history() {
        var history_container = document.getElementById("history_container");
        history_container.innerHTML = ""
        if (rule_consequense.length > 0) {
            for (var i = 0; i <= current_state_position + 1; i++) {
                add_element_to_history_container(i, states[i])
            }
        } else {
            add_element_to_history_container(0, states[0])
        }
    }

    function paint_code_history() {
        var code_history_container = document.getElementById("code_history_container");
        code_history_container.innerHTML = "";
        if (rule_consequense.length > 0) {
            for (var i = 0; i <= current_state_position; i++) {
                add_element_to_code_history_container(i, states[i], rule_consequense[i], states[i + 1])
            }
        }
    }

    function go() { // work with i >= 0
        if (current_state_position < rule_consequense.length) {
            is_playing = true;
            console.log("current" + current_state_position)
            paint_algorithm(current_state_position);
            current_state_position = current_state_position + 1;
            increase_rewind(increase_rew_val);
            increase_rew_val = 1;
            current_timeout = setTimeout(go, time_status_demo);
        } else {
            console.log("can`t go")
            reset_indicators();
        }
    }

    function reset_indicators() {
        is_playing = false;
        is_paused = false;
    }

    function reset_state_position() {
        current_state_position = 0;
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

    function set_rewind_to_zero() {
        $('#rewind').prop({
            'value': 0,
        });
    }

    function run_algorithm() {
        increase_rew_val = 0;
        current_timeout = setTimeout(go, 500, current_state_position);
    }

    function add_element_to_history_container(id, element) {
        var para = document.createElement("p");
        para.id = "h" + id.toString();
        var node = document.createTextNode((id + 1).toString() + ". " + element);
        para.appendChild(node);
        var history_container = document.getElementById("history_container");
        history_container.appendChild(para);
        scroll_down_history_container();
    }

    function add_element_to_code_history_container(id, pre, rule, after) {
        var para = document.createElement("p");
        var br_1 = document.createElement("br");
        var br_2 = document.createElement("br");
        var br_3 = document.createElement("br");

        para.id = "h" + id.toString();
        var step = document.createTextNode("STEP#" + (id + 1).toString());
        var node_1 = document.createTextNode("before: " + pre);
        var node_2 = document.createTextNode("rule: " + rule);
        var node_3 = document.createTextNode("after: " + after);
        para.appendChild(step);
        para.appendChild(br_1);
        para.appendChild(node_1);
        para.appendChild(br_2);
        para.appendChild(node_2);
        para.appendChild(br_3);
        para.appendChild(node_3);


        var code_history_container = document.getElementById("code_history_container");
        code_history_container.appendChild(para);
        scroll_down_code_history_container();
    }

    function scroll_down_history_container() {
        var history_container = document.getElementById("history_container");
        history_container.scrollTop = history_container.scrollHeight;
    }

    function scroll_down_code_history_container() {
        var code_history_container = document.getElementById("code_history_container");
        code_history_container.scrollTop = code_history_container.scrollHeight;
    }

    function reset_history_container() {
        history_container = document.getElementById("history_container").innerHTML = "";
    }

    function reset_code_history_container() {
        code_history_container = document.getElementById("code_history_container").innerHTML = "";
    }

    function pre_markov_container_zoom(num) {
        pre_markov_container_font += num;
        if (pre_markov_container_font < 1)
            pre_markov_container_font = 1;
        if (pre_markov_container_font > 50)
            pre_markov_container_font = 50;
        var pre_markov_cont = document.getElementById('pre_markov_container');
        for (var i = 0; i < pre_markov_cont.childNodes.length; i++) {
            child = pre_markov_cont.childNodes[i];
            if (child.className == 'markov_container_p') {
                child.style.fontSize = pre_markov_container_font.toString() + "px";
            }
        }
    }

    function markov_container_zoom(num) {
        markov_container_font += num;
        if (markov_container_font < 1)
            markov_container_font = 1;
        if (markov_container_font > 50)
            markov_container_font = 50;
        var markov_cont = document.getElementById('markov_container');
        for (var i = 0; i < markov_cont.childNodes.length; i++) {
            child = markov_cont.childNodes[i];
            if (child.className == 'markov_container_p') {
                child.style.fontSize = markov_container_font.toString() + "px";
            }
        }
    }

    function after_markov_container_zoom(num) {
        after_markov_container_font += num;
        if (after_markov_container_font < 1)
            after_markov_container_font = 1;
        if (after_markov_container_font > 50)
            after_markov_container_font = 50;
        var after_markov_cont = document.getElementById('after_markov_container');
        for (var i = 0; i < after_markov_cont.childNodes.length; i++) {
            child = after_markov_cont.childNodes[i];
            if (child.className == 'markov_container_p') {
                child.style.fontSize = after_markov_container_font.toString() + "px"
            }
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

    function add_element_to_algorithms(title, algorithm) {
        saved_algorithms[title] = algorithm;
        $('#algorithms').append($('<option>', {
            value: title,
            text: title
        }));
        $("#algorithms").val(title).change();

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
                url: 'send_markov',
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





