$(document).ready ( function(){
  //$("#slide_1").css({"display": "block"});

  $.ajaxSetup ({
    cache: false
  });

  $(".nav a").on("click", function() {
    $(".nav a").removeClass("active");
    $(this).addClass("active");

    $(".slides").css({"display": "none"});

    i = $(this).attr("index");
    $(`#slide_${i}`).css({"display": "block"});

    $.getScript(`js/slide_${i}.js`);
  });

  $("a:contains(Global situation)").click();
});