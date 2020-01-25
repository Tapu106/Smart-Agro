
(function ($) {
    "use strict";
    /*==================================================================
    [ Validate ]*/
    var name = $('.validate-input input[name="name"]');
    var email = $('.validate-input input[name="email"]');
    var password = $('.validate-input textarea[name="password"]');
    var docname = $('.validate-input input[name="DocName"]');
    var editoremail = $('.validate-input input[name="EditorEmail"]');
    var btn=$('.validate-input input[name="ok"]');

    $('.validate-form').on('submit',function(){
        var check = true;
        if($(name).val().trim() == ''){
            showValidate(name);
            check=false;
        }
        if($(docname).val().trim() == ''){
            showValidate(docname);
            check=false;
        }

        if($(email).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
            showValidate(email);
            check=false;
        }
        if($(editoremail).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
            showValidate(editoremail);
            check=false;
        }
        if($(password).val().trim() == ''){
            showValidate(password);
            check=false;
        }
        console.log($(docname).val().trim());
        console.log($(editoremail).val().trim());
        return check;
    });
    $('.validate-form .input1').each(function(){
        $(this).focus(function(){
           hideValidate(this);
       });
    });
    function showValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).addClass('alert-validate');
    }
    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }
    // document.getElementById("singlebutton").onclick = function () {
    //     location.href = "/write";
    // };
    btn.submit(function(){
        console.log($(docname).val().trim());
        console.log($(editoremail).val().trim());
        
        
    })
    
    localStorage['userName']=$(name).val();
    localStorage['userEmail']=$(email).val();
    console.log(localStorage['userName']+" "+localStorage['userName']);
    
    
    
    

})(jQuery);