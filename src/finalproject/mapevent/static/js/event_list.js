function populateList() {
//    window.alert("111");
    $.get("/get-changes/")
      .done(function(data) {
          // window.alert("444");
          var list = $("#event-list");
          list.data('max-time', data['max-time']);
          list.html('');

          console.log("populateList")
          getUpdates();
          for (var i = 0; i < data.posts.length; i++) {
              post = data.posts[i];
              var new_post = $(post.html);
//              var max_time = list.data("max-time");
              new_post.data("event-id", post.id);
              list.prepend(new_post);
          }

      });
}