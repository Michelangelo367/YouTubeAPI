from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.http import HttpResponse,Http404
from apiclient.discovery import build
from datetime import datetime
import json

file = open('api_key.txt','r')
api_key = file.read().replace('\n', '')
youtube = build('youtube','v3',developerKey = api_key)
file.close()
nextPageToken = None
playlistId = None

def mainView(request):
    return render(request,'main.html')

@csrf_exempt
def keywordSearchView(request):
    result = []
    # if request is POST
    if request.method == 'POST' and request.is_ajax():
        # for post we need to use request.body instead of request.POST.get('')
        request = json.loads(request.body)
        keyword = request['keyword']
        fromYear = int(request['from-year'])
        fromMonth = int(request['from-month'])
        fromDay = int(request['from-day'])
        toYear = int(request['to-year'])
        toMonth = int(request['to-month'])
        toDay = int(request['to-day'])
        # YouTube was published in 2005
        start_time = datetime(year=fromYear, month=fromMonth, day=fromDay).strftime('%Y-%m-%dT%H:%M:%SZ')
        end_time = datetime(year=toYear, month=toMonth, day=toDay).strftime('%Y-%m-%dT%H:%M:%SZ')
        # execute search based on keyword
        obj = get_keyword_videos(keyword, None, start_time, end_time)
        # get next page token
        nextPageToken = obj['nextPageToken']
        # append dictionary into array
        for item in obj['result']:
            result.append({'title':item['snippet']['title'], 'description':item['snippet']['description'], 'publishedAt': item['snippet']['publishedAt'], 'videoId':item['id']['videoId'],
              'thumbnails':item['snippet']['thumbnails']['default']['url'], 'channelTitle':item['snippet']['channelTitle']})

    # if request is GET
    elif request.method == 'GET' and request.is_ajax():
        req = request.GET.dict()
        keyword = req['keyword']
        nextPageToken = req['nextPageToken']
        fromYear = int(req['from-year'])
        fromMonth = int(req['from-month'])
        fromDay = int(req['from-day'])
        toYear = int(req['to-year'])
        toMonth = int(req['to-month'])
        toDay = int(req['to-day'])
        # YouTube was published in 2005
        start_time = datetime(year=fromYear, month=fromMonth, day=fromDay).strftime('%Y-%m-%dT%H:%M:%SZ')
        end_time = datetime(year=toYear, month=toMonth, day=toDay).strftime('%Y-%m-%dT%H:%M:%SZ')
        # get more videos in next page
        obj = get_keyword_videos(keyword, nextPageToken, start_time, end_time)
        # get next page token
        nextPageToken = obj['nextPageToken']

        # append dictionary into array
        for item in obj['result']:
            result.append({'title':item['snippet']['title'], 'description':item['snippet']['description'], 'publishedAt': item['snippet']['publishedAt'], 'videoId':item['id']['videoId'],
              'thumbnails':item['snippet']['thumbnails']['default']['url'], 'channelTitle':item['snippet']['channelTitle']})

    # return object to front
    return HttpResponse(json.dumps({'result':result, 'nextPageToken': nextPageToken}), content_type='application/json')

# load more keyword videos
def get_keyword_videos(keyword, nextPageToken, start_time, end_time):
    # execute search based on keyword in next page
    res = youtube.search().list(part='snippet',
                        q=keyword,
                        type='video',
                        publishedAfter=start_time,
                        publishedBefore=end_time,
                        pageToken=nextPageToken,
                        maxResults=28).execute()

    d = dict()
    # get next page token
    d['nextPageToken'] = res.get('nextPageToken')
    # append dictionary into array
    d['result'] = sorted(res['items'], key=lambda x:x['snippet']['publishedAt'])
    return d

# channel search view
@csrf_exempt
def channelSearchView(request):
    result = []
    if request.method == 'POST' and request.is_ajax():
        # for post we need to use request.body instead of request.POST.get('')
        channelName = json.loads(request.body)['channel']

        # api call to get channel id based provided channel name
        res = youtube.search().list(part='snippet', q=channelName, type='channel').execute()
        if(len(res['items']) == 0):
            print('No such channel name')
        else:
            channel_id = res['items'][0]['id']['channelId']
            res = youtube.channels().list(id=channel_id, part='contentDetails').execute()
            playlistId = res['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            obj = get_channel_videos(playlistId,None)
            nextPageToken = obj['nextPageToken']
            # get videos in the channel
            for video in obj['result']:
                element = {'videoId':video['snippet']['resourceId']['videoId'], 'title':video['snippet']['title'], 'description':video['snippet']['description']}
                result.append(element)

    # if request is GET
    elif request.method == 'GET' and request.is_ajax():
        # get more channel videos
        obj = get_channel_videos(request.GET['playlistId'],request.GET['nextPageToken'])
        nextPageToken = obj['nextPageToken']
        playlistId = obj['playlistId']

        for item in obj['result']:
            element = {'videoId':item['snippet']['resourceId']['videoId'], 'title':item['snippet']['title'], 'description':item['snippet']['description']}
            result.append(element)

    return HttpResponse(json.dumps({'result':result, 'nextPageToken': nextPageToken, 'playlistId':playlistId}), content_type='application/json')

# load more channel videos
def get_channel_videos(playlistId, nextPageToken):
    # get more channel videos
    res = youtube.playlistItems().list(playlistId=playlistId,
                                        part='snippet',
                                        maxResults=28,
                                        pageToken=nextPageToken).execute()


    d = dict()
    d['nextPageToken'] = res.get('nextPageToken')
    d['playlistId'] = playlistId
    d['result'] = res['items']
    return d
