"use strict";
(function(){
  // variables
  // these are not global since I used modular pattern
  var row;
  var eachVideoDiv;
  var iframe;
  var title;
  var titleLink;
  var nextPageToken = undefined;

  $(document).ready(function(){
    // invoked when search button get clicked.
    $("#search").click(function(){
      event.preventDefault();
      // remove all the childNode when search button clicked
      document.getElementById('sub-container').innerHTML = '';
      $.ajax({
        type: 'POST',
        url: '/search/',
        contentType:'application/json',
        data: JSON.stringify({'keyword': $('#keyword').val()}),
        success: function(data) {
          nextPageToken = data['nextPageToken']
          appendVideos(data)
        },
        error: function(error) {
          nextPageToken = undefined
          console.log("error: " + error);
        }
      });
      return false
    });

    // when user scrolls to bottom, load more videos
    $(window).on('scroll', function() {
      event.preventDefault();
      var scrollHeight = $(document).height();
      var scrollPosition = $(window).height() + $(window).scrollTop();
      if ((scrollHeight - scrollPosition) / scrollHeight === 0) {
        if(nextPageToken != undefined){
          loadMoreVideos(nextPageToken)
        }
      }
    });
  });

  function loadMoreVideos(nextPageToken){
    $.ajax({
      type: 'GET',
      url: '/search/',
      contentType:'application/json',
      data: { 'nextPageToken': nextPageToken,
              'keyword': $('#keyword').val()
      },
      success: function(data){
        console.log('ajax->loadMoreVideos() success:' + data);
        // refresh next page token
        nextPageToken = data['nextPageToken']
        appendVideos(data)
      },
      error: function(error){
        nextPageToken = undefined
        console.log('ajax->loadMoreVideos() error: ' + error);
      }
    });
  }

  function appendVideos(data){

    var i;
    var element;
    for (i = 0; i < data['result'].length; i++){
      element = data['result'][i]

      if(i % 4 == 0){
        // create a row div
        row = document.createElement('div')
        row.className = 'row'
      }

      // create each div for a video
      eachVideoDiv = document.createElement('div')
      eachVideoDiv.className = 'video'

      // create title
      title = document.createElement('p')
      title.className = 'title'

      // this is actual title
      titleLink = document.createElement('a')
      titleLink.href = 'https://www.youtube.com/embed/'+element['videoId']
      titleLink.target = '_blank'
      titleLink.innerHTML = element['title']

      // append the actual title into title container
      title.appendChild(titleLink)

      // insert video
      iframe = document.createElement('iframe')
      iframe.className = 'frame'
      iframe.src = 'https://www.youtube.com/embed/'+element['videoId']

      // append every element into video div
      eachVideoDiv.appendChild(title)
      eachVideoDiv.appendChild(iframe)

      // append the video div to the row div
      row.appendChild(eachVideoDiv)

      // append the row div to video-container
      if(i % 4 == 3){
        document.getElementById('sub-container').appendChild(row);
      }
    }

    // edge case
    if(row.length != 0){
      document.getElementById('sub-container').appendChild(row);
    }
  }
})();
