"use strict";
(function(){
  // variables
  // these are not global since I used modular pattern
  var row;
  var eachVideoDiv;
  var iframe;
  var title;
  var titleLink;
  let nextPageToken = undefined;
  var playlistId = undefined;
  var searchType = 'keyword';

  $(document).ready(function(){

    // set default 'to' as today
    document.getElementById('to').valueAsDate = new Date();

    $('#radioKeyword').click(function(){
      searchType = 'keyword';
      radioKeywordClicked();
    })

    $('#radioChannel').click(function(){
      searchType = 'channel';
      radioChannelClicked();
    })


    // invoked when search button get clicked.
    $("#search").click(function(){
      event.preventDefault();
      // remove all the childNode when search button clicked
      document.getElementById('sub-container').innerHTML = '';
      if(searchType == 'keyword'){
        callKeywordAjax();
      }else{
        callChannelAjax();
      }

    });

    // when user scrolls to bottom, load more videos
    $(window).on('scroll', function() {
      var scrollHeight = $(document).height();
      var scrollPosition = $(window).height() + $(window).scrollTop();
      if ((scrollHeight - scrollPosition) / scrollHeight === 0) {
        if(searchType == 'keyword'){
          // if getNextPageToken is null, do not load videos
          if(getNextPageToken() != null){
            loadMoreKeywordVideos(getNextPageToken())
          }
        }else{
          //console.log('scroll:' + getNextPageToken());
          // if getNextPageToken is null, do not load videos
          if(getNextPageToken() != null){
            loadMoreChannelVideos(playlistId, getNextPageToken());
          }
        }
      }
    });
  });


  function callKeywordAjax(){

    // get dates
    let from = document.getElementById('from').value.split('-');
    let to = document.getElementById('to').value.split('-');
    let keyword = $('#keyword').val();

    if(keyword.length <= 0 || keyword == undefined){
      alert('Input must not be empty!');
      return;
    }
    $.ajax({
      type: 'POST',
      url: '/keyword/search/',
      contentType:'application/json',
      data: JSON.stringify({
        'keyword': keyword,
        'from-year': from[0],
        'from-month': from[1],
        'from-day': from[2],
        'to-year': to[0],
        'to-month': to[1],
        'to-day': to[2]
      }),
      success: function(data) {
        setNextPageToken(data['nextPageToken']);
        appendVideos(data)
      },
      error: function(error) {
        setNextPageToken(undefined);
        console.log('callKeywordAjax() error: ');
        console.log(error);
      }
    });
  }

  function callChannelAjax(){
    let channel = $('#channel').val();
    if(channel.length <= 0 || channel == undefined){
      alert('Input must not be empty!');
      return;
    }
    $.ajax({
      type: 'POST',
      url: '/channel/search/',
      contentType:'application/json',
      data: JSON.stringify({'channel': channel}),
      success: function(data) {
        // if data['result'].length == 0, no such channel name
        if(data['result'].length <= 0){
          document.getElementById('channel').innerHTML='';
          document.getElementById('channel').style.borderColor = 'red';
          document.getElementById('channel').value = 'No such channel name exists';
        }else{
          //console.log(data);
          setNextPageToken(data['nextPageToken'])
          playlistId = data['playlistId']
          appendVideos(data)
        }
      },
      error: function(error) {
        setNextPageToken(undefined);
        playlistId = undefined;
        console.log('callChannelAjax() error: ');
        console.log(error);
      }
    });
  }

  function loadMoreKeywordVideos(nextPageToken){
    if(nextPageToken == undefined){
      return;
    }
    // get dates
    let from = document.getElementById('from').value.split('-');
    let to = document.getElementById('to').value.split('-');
    $.ajax({
      type: 'GET',
      url: '/keyword/search/',
      contentType:'application/json',
      data:
        {
          'nextPageToken': nextPageToken,
          'keyword': $('#keyword').val(),
          'from-year': from[0],
          'from-month': from[1],
          'from-day': from[2],
          'to-year': to[0],
          'to-month': to[1],
          'to-day': to[2]
        },
      success: function(data){
        console.log('ajax->loadMoreKeywordVideos() success:');
        console.log(data);
        // refresh next page token
        setNextPageToken(data['nextPageToken'])
        appendVideos(data)
      },
      error: function(error){
        setNextPageToken(undefined);
        console.log('ajax->loadMoreKeywordVideos() error: ');
        console.log(error);
      }
    });
  }

  function loadMoreChannelVideos(playlistId, nextPageToken){
    if(playlistId == undefined || nextPageToken == undefined){
      return;
    }

    $.ajax({
      type: 'GET',
      url: '/channel/search/',
      contentType:'application/json',
      data:
        {
          'nextPageToken': nextPageToken,
          'playlistId': playlistId
        },
      success: function(data){
        console.log('ajax->loadMoreChannelVideos() success:');
        console.log(data);
        // refresh next page token
        setNextPageToken(data['nextPageToken']);
        playlistId = playlistId;
        appendVideos(data)
      },
      error: function(error){
        setNextPageToken(undefined)
        playlistId = undefined
        console.log('ajax->loadMoreChannelVideos() error: ');
        console.log(error);
      }
    });
  }

  function setNextPageToken(token){
    nextPageToken = token;
  }

  function getNextPageToken(){
    return nextPageToken;
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

  function radioKeywordClicked(){
    playlistId = undefined;
    setNextPageToken(undefined)
    document.getElementById('description').innerHTML = 'A bot searches all YouTube videos based on your keyword!'
    document.getElementById('inputForm').innerHTML = '';
    document.getElementById('date').style.visibility = 'visible';

    let input = document.createElement('input');
    input.setAttribute('id','keyword');
    input.setAttribute('type','text');
    input.setAttribute('class','form-control form-control-lg');
    input.setAttribute('placeholder','Enter your keyword.');
    input.setAttribute('minlength','1');
    document.getElementById('inputForm').appendChild(input);
  }

  function radioChannelClicked(){
    playlistId = undefined;
    setNextPageToken(undefined)
    document.getElementById('description').innerHTML = 'A bot searches all YouTube videos based on the given channel name!'
    document.getElementById('inputForm').innerHTML = '';
    document.getElementById('date').style.visibility = 'hidden';

    let input = document.createElement('input');
    input.setAttribute('id','channel');
    input.setAttribute('type','text');
    input.setAttribute('class','form-control form-control-lg');
    input.setAttribute('placeholder','Enter a channel name.');
    input.setAttribute('minlength','1');
    document.getElementById('inputForm').appendChild(input);
  }
})();
