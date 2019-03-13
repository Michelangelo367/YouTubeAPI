from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from django.http import HttpResponse,Http404
from apiclient.discovery import build
from datetime import datetime
import json

api_key = 'Your API'
# YouTube was published in 2005
start_time = datetime(year=2005, month=1, day=1).strftime('%Y-%m-%dT%H:%M:%SZ')
end_time = datetime(year=2008, month=1, day=1).strftime('%Y-%m-%dT%H:%M:%SZ')
youtube = build('youtube','v3',developerKey = api_key)
nextPageToken = None

def mainView(request):
    return render(request,'main.html')

@csrf_exempt
def searchView(request):
    result = []
    # if request is POST
    if request.method == 'POST' and request.is_ajax():
        # for post we need to use request.body instead of request.POST.get('')
        keyword = json.loads(request.body)['keyword']
        print(keyword)
        # execute search based on keyword
        res = youtube.search().list(part='snippet',
                            q=keyword,
                            type='video',
                            publishedAfter=start_time,
                            publishedBefore=end_time,
                            maxResults=28).execute()

        # get next page token
        nextPageToken = res.get('nextPageToken')
        # append dictionary into array
        for item in sorted(res['items'], key=lambda x:x['snippet']['publishedAt']):
            result.append({'title':item['snippet']['title'], 'description':item['snippet']['description'], 'publishedAt': item['snippet']['publishedAt'], 'videoId':item['id']['videoId'],
              'thumbnails':item['snippet']['thumbnails']['default']['url'], 'channelTitle':item['snippet']['channelTitle']})

    # if request is GET
    elif request.method == 'GET' and request.is_ajax():
        print('GET keyword: ' + str(request.GET['keyword']))
        # get more videos in next page
        obj = get_keyword_videos(request.GET['keyword'],request.GET['nextPageToken'])
        # append dictionary into array
        for item in obj['result']:
            result.append({'title':item['snippet']['title'], 'description':item['snippet']['description'], 'publishedAt': item['snippet']['publishedAt'], 'videoId':item['id']['videoId'],
              'thumbnails':item['snippet']['thumbnails']['default']['url'], 'channelTitle':item['snippet']['channelTitle']})

        # get next page token
        nextPageToken = obj['nextPageToken']
    # return object to front
    return HttpResponse(json.dumps({'result':result, 'nextPageToken': nextPageToken}), content_type='application/json')

# load more videos
def get_keyword_videos(keyword, nextPageToken):
    # execute search based on keyword in next page
    res = youtube.search().list(part='snippet',
                        q=keyword,
                        type='video',
                        publishedAfter=start_time,
                        publishedBefore=end_time,
                        pageToken=nextPageToken,
                        maxResults=28).execute()

    d = dict();
    # get next page token
    d['nextPageToken'] = res.get('nextPageToken')
    # append dictionary into array
    d['result'] = sorted(res['items'], key=lambda x:x['snippet']['publishedAt'])
    return d
