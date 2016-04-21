(function(){
	var app = angular.module('stream-window', [],
		function($locationProvider){$locationProvider.html5Mode(true);}
    );
	var client = new PeerManager();
	var mediaConfig = {
        audio:true,
        video: {
			mandatory: {},
			optional: []
        }
    };

    var loc = window.location.pathname;
    var param = loc.split('/');

    app.factory('camera', ['$rootScope', '$window', function($rootScope, $window){
    	var camera = {};
    	camera.preview = $window.document.getElementById('localVideo');

    	camera.start = function(){
			  return requestUserMedia(mediaConfig).then(
          function(stream){
            console.log('++++++++', stream, '++++++++++++');
            attachMediaStream(camera.preview, stream);
            client.setLocalStream(stream);
            camera.stream = stream;
            $rootScope.$broadcast('cameraIsOn',true);
            
            return stream;
          }
        ).catch(Error('Failed to get access to local media.'));
		};
    	camera.stop = function(){
    		return new Promise(function(resolve, reject){			
				try {
					/* original ProjectRTC has bug -> stop() no longer works */
          //camera.stream.stop();
          var tracks = camera.stream.getTracks();
          tracks[0].stop();
          tracks[1].stop();

					camera.preview.src = '';
					resolve();
				} catch(error) {
					reject(error);
				}
    		})
    		.then(function(result){
    			$rootScope.$broadcast('cameraIsOn',false);
    		});	
		};
		return camera;
    }]);

	app.controller('RemoteStreamsController', ['camera', '$location', '$http', '$timeout', '$scope', function(camera, $location, $http, $timeout, $scope){

		var rtc = this;

    $scope.oldStream = '';
    $scope.countTime = 0;

		rtc.remoteStreams = [];
		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}


    rtc.reloadGroup = function(){
      var loc = window.location.pathname;
      var param = loc.split('/');
      console.log(param);
      if( param[1] != "profile" ){
        return;
      }
      $http.get('/group/' + param[2] + '/' + param[3]).success(function(data){
        if(!data)
          return;
        rtc.group = data.group[0];        
        $scope.act = data;
        console.log( 'reload group: ', rtc.group );
        if( ! rtc.group.stream ){
          return;
        }
        if( rtc.group.stream != $scope.oldStream ){
          rtc.call( rtc.group.stream );
          $scope.oldStream = rtc.group.stream;
        }
        // if( rtc.group.stream ){
        //   var found = false;
        //   for( var astream in rtc.remoteStreams ){
        //     if( astream.id == rtc.group.stream ){
        //       found = true;
        //     }
        //   }
          
        //   if(!found){
        //     rtc.group.stream = "";
        //     $http.put('/group/' + param[2] + '/artist', { "link": '' }).success(function(data){
        //       console.log('remove old stream', data);
        //     });
        //   }

        // }
      });
    };



    rtc.loadData = function () {
      // get list of streams from the server
      $http.get('/streams.json').success(function(data){
        console.log('=========================');
        console.log(data);
        console.log('=========================');
        // filter own stream
        var streams = data.filter(function(stream) {
          return stream.id != client.getId();
        });
        // get former state
        for(var i=0; i<streams.length;i++) {
          var stream = getStreamById(streams[i].id);
          streams[i].isPlaying = (!!stream) ? stream.isPLaying : false;
        }
        // save new streams
        rtc.remoteStreams = streams;
      });
    };

    rtc.view = function(stream){
      client.peerInit(stream.id);
      stream.isPlaying = !stream.isPlaying;
    };
    rtc.call = function(stream){
      /* If json isn't loaded yet, construct a new stream 
       * This happens when you load <serverUrl>/<socketId> : 
       * it calls socketId immediatly.
       **/
      if(!stream.id){
        stream = {id: stream, isPlaying: false};
        rtc.remoteStreams.push(stream);
      }
      if(camera.isOn){
        client.toggleLocalStream(stream.id);
        if(stream.isPlaying){
          client.peerRenegociate(stream.id);
        } else {
          client.peerInit(stream.id);
        }
        stream.isPlaying = !stream.isPlaying;
      } else {
        camera.start()
        .then(function(result) {
          client.toggleLocalStream(stream.id);
          if(stream.isPlaying){
            client.peerRenegociate(stream.id);
          } else {
            client.peerInit(stream.id);
          }
          stream.isPlaying = !stream.isPlaying;
        })
        .catch(function(err) {
          console.log(err);
        });
      }
    };

    $scope.onTimeout = function(){
      $scope.countTime++;
      if( $scope.countTime == 10){
        rtc.userReloadGroup();
      }else
        mytimeout = $timeout($scope.onTimeout,1000);
    };

    var mytimeout = $timeout( $scope.onTimeout, 1000);

    rtc.userReloadGroup = function(){
      rtc.loadData();
      rtc.reloadGroup();
      $scope.countTime = 0;
      mytimeout = $timeout($scope.onTimeout, 1000);
    }

    //initial load
    rtc.loadData();
    rtc.reloadGroup();
    if($location.url() != '/stream/trial' && ! $location.url().startsWith('/profile/')){
      rtc.call($location.url().slice(8));
    };
  }]);






  app.controller('LocalStreamController',['camera', '$scope', '$window', '$http', function(camera, $scope, $window, $http){
    var localStream = this;
    localStream.name = 'Guest';
    localStream.link = '';
    localStream.cameraIsOn = false;


    window.initMap = function() {
      var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 7,
        center: {lat:  25.038085 , lng:121.538231},
        mapTypeId: google.maps.MapTypeId.TERRAIN
      });

      var flightPath = new google.maps.Polyline({
        //geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      flightPath.setMap(map);
    }


    $scope.$on('cameraIsOn', function(event,data) {
      $scope.$apply(function() {
        console.log('$scope.on(cameraIsOn) ? ', data , '      @      ', event);
        localStream.cameraIsOn = data;
      });
    });

    $scope.addStreamUrl = function(){
      if(localStream.link){
        var llink = localStream.link;
        var linkparam = llink.split('/');
        $http.put('/group/' + param[2] + '/artist', { "link": linkparam[ linkparam.length-1 ] }).success(function(data){
          console.log(data);
        });
      }else{
        return;
      }
    };

    $scope.removeStreamUrl = function(){
      $http.put('/group/' + param[2] + '/artist', { "link": '' }).success(function(data){
        console.log(data);
      });
    };

    localStream.toggleCam = function(){
      if(localStream.cameraIsOn){
        console.log('Local camera is on!');
        camera.stop()
        .then(function(result){
          client.send('leave');
          client.setLocalStream(null);
        })
        .catch(function(err) {
          console.log(err);
        });
      } else {
        console.log('Trying to start for name: ', localStream.name);
        camera.start()
        .then(function(result) {
          console.log('Result: ', result);
          //localStream.link = $window.location.host + '/stream' + client.getId();
          client.send('readyToStream', { name: localStream.name });
        })
        .catch(function(err) {
          console.log(err);
          localStream.link = 'failllll';
        });
        localStream.link = $window.location.host + '/stream/' + client.getId();
      }
    };
  }]);
})();
