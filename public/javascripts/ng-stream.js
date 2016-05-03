(function(){
	var app = angular.module('stream-window', ['ngAnimate', 'ui.bootstrap', 'ui.bootstrap.datetimepicker'],
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
    // socket part
    var socket = io.connect();
    $scope.socket_status = false;
    socket.on('id', function(id){
      console.log('socket:'+id);
      
      var param = loc.split('/');
      
      if( param[1] != "profile" ){
        return;
      }
      var info = {act_id:param[2], character:param[3], type:2} //type 2 for web user

      socket.emit('register_client_id', info);
    });
    socket.on('register_status', function(status){
      if (status=='success') {
        $scope.socket_status = true;
        console.log('socket is now on');
      }else{
        $scope.socket_status = false;
      }
    })
    socket.on('new_mission_client', function(mission){
      console.log("new mission:");
      console.log(mission)
    });

    // 
    $scope.oldStream = '';
    $scope.countTime = 0;

		rtc.remoteStreams = [];
		function getStreamById(id) {
		    for(var i=0; i<rtc.remoteStreams.length;i++) {
		    	if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
		    }
		}

    var map, poly, oldlatlng, marker;

    window.initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: {lat:  25.017474 , lng:121.538739},
        mapTypeId: google.maps.MapTypeId.HYBRID
      });
      var mapstyle = 
      [
        {
            "featureType": "landscape",
            "stylers": [
                {
                    "visibility": "simplified"
                },
                {
                    "color": "#2b3f57"
                },
                {
                    "weight": 0.1
                }
            ]
        },
        {
            "featureType": "administrative",
            "stylers": [
                {
                    "visibility": "on"
                },
                {
                    "hue": "#ff0000"
                },
                {
                    "weight": 0.4
                },
                {
                    "color": "#ffffff"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "labels.text",
            "stylers": [
                {
                    "weight": 1.3
                },
                {
                    "color": "#FFFFFF"
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f55f77"
                },
                {
                    "weight": 3
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f55f77"
                },
                {
                    "weight": 1.1
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [
                {
                    "color": "#f55f77"
                },
                {
                    "weight": 0.4
                }
            ]
        },
        {},
        {
            "featureType": "road.highway",
            "elementType": "labels",
            "stylers": [
                {
                    "weight": 0.8
                },
                {
                    "color": "#ffffff"
                },
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels",
            "stylers": [
                {
                    "color": "#ffffff"
                },
                {
                    "weight": 0.7
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi",
            "stylers": [
                {
                    "color": "#6c5b7b"
                }
            ]
        },
        {
            "featureType": "water",
            "stylers": [
                {
                    "color": "#f3b191"
                }
            ]
        },
        {
            "featureType": "transit.line",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        }
      ]
      map.setOptions({styles:mapstyle});
      
      poly = new google.maps.Polyline({
        //geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.5,
        strokeWeight: 2
      });

      poly.setMap(map);
    };

    var addPoint = function(){
      if ($scope.act.acttype==1) {
        console.log("equals 1");
      }else{
        console.log("not equals 1");
      }
      var gps, latlng;
      if(!rtc.group.artist.gps)
        return;
      else{
        gps = rtc.group.artist.gps;
        latlng = new google.maps.LatLng({ lat: parseFloat( gps.lati ), lng: parseFloat(gps.longi) });
        if( oldlatlng && oldlatlng.equals( latlng ) )
          return;
      }
      var path = poly.getPath();
      console.log('--------------------------');
      console.log(path);
      console.log('--------------------------');


      // Because path is an MVCArray, we can simply append a new coordinate
      // and it will automatically appear.
      path.push( latlng );

      if(marker){
        marker.setMap(null);
        delete marker;
      }
      // Add a new marker at the new plotted point on the polyline.
      marker = new google.maps.Marker({
        position: latlng,
        place: gps.rectime,
        map: map
      });
      // move map center at the new point
      map.panTo(latlng);

      oldlatlng = latlng;
    };
      // rtc.reloadGroup = function(){
      //   var loc = window.location.pathname;
      //   var param = loc.split('/');
      //   console.log(param);
      //   if( param[1] != "profile" ){
      //     return;
      //   }
      //   $http.get('/group/' + param[2] + '/' + param[3]).success(function(data){
      //     if(!data)
      //       return;
      //     console.log(data);
      //     rtc.group = data.group[0];        
      //     $scope.act = data;
      //     console.log( 'reload group: ', rtc.group );
      //     if( ! rtc.group.stream ){
      //       return;
      //     }
      //     if( rtc.group.stream != $scope.oldStream ){
      //       rtc.call( rtc.group.stream );
      //       $scope.oldStream = rtc.group.stream;
      //     }
      //   });
      // };
rtc.reloadGroup = function(){
      var loc = window.location.pathname;
      var param = loc.split('/');
      console.log(param);
      if( param[1] != "profile"){
        return;
      }
      $http.get('/adminact/' + param[2]).success(function(data){
        if(!data)
          return;
        $scope.act = data;
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log( 'reload act: ', $scope.act.name );
        
       
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
        addPoint();
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
        if( $scope.countTime == 5){
          rtc.userReloadGroup();
          addPoint();
        }else
          mytimeout = $timeout($scope.onTimeout,1000);
      };

      var mytimeout = $timeout( $scope.onTimeout, 1000);

      rtc.userReloadGroup = function(){
        rtc.loadData();
        rtc.reloadGroup();
        $scope.countTime = 0;
        $timeout.cancel( mytimeout );
        mytimeout = $timeout($scope.onTimeout, 1000);
      }

    //initial load
    rtc.loadData();
    rtc.reloadGroup();
    if($location.url() != '/stream/trial' && ! $location.url().startsWith('/profile/')){
      rtc.call($location.url().slice(8));
    };
  }]);

  app.controller('RemoteStreamsControllerforAdmin', ['camera', '$location', '$http', '$timeout', '$scope', function(camera, $location, $http, $timeout, $scope){

    var rtc = this;
    $scope.missions = [];
    var socket = io.connect();
    $scope.socket_status = false;
    var param = loc.split('/');
    if( param[1] != "admin"&&param[2]!="stream" ){
      return;
    }
    var act_id = param[3];
    socket.on('id', function(id){
      console.log('socket:'+id);
      var info = {act_id:act_id, character:"admin", type:1} //type 1 for admin user
      socket.emit('register_client_id', info);
    });
    socket.on('register_status', function(status){
      if (status=='success') {
        $scope.socket_status = true;
        console.log('socket is now on');
      }else{
        $scope.socket_status = false;
      }
    });
    $scope.sendMission = function(){
      if( ! $scope.mission.content || ! $scope.mission.name ){
        console.log('no name or location orz');
        return;
      }
      var content = {act_id:act_id, mission:{name:$scope.mission.name, requirement:$scope.mission.content, time:new Date()}}
      missions.append(content.mission);
      socket.emit('new_mission_server', content);
    };
      
    // open new mission dialog
    // $scope.open = function () {
    //   var modalInstance = $uibModal.open({
    //     animation: true,
    //     templateUrl: 'new-mission-modal.html',
    //   });
    // };

    $scope.oldStream = [];
    $scope.countTime = 0;
    rtc.group = [];

    rtc.remoteStreams = [];
    function getStreamById(id) {
        for(var i=0; i<rtc.remoteStreams.length;i++) {
          if (rtc.remoteStreams[i].id === id) {return rtc.remoteStreams[i];}
        }
    }

    var map, oldlatlng=[], marker=[], circles=[];

    window.initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 19,
        center: {lat:  25.017474 , lng:121.538739},
        mapTypeId: google.maps.MapTypeId.HYBRID
      });
    };

    var addPoint = function(){
      var gps, latlng;
      var temp = [0., 0.];
      var counter = 0
      console.log('```````````````````````````');
      for (var i = $scope.act.group.length - 1; i >= 0; i--) {
        if($scope.act.group[i].artist.gps){
          gps = $scope.act.group[i].artist.gps;
          if (isNaN(parseFloat(gps.lati))||isNaN(parseFloat(gps.longi))) {
            continue;
          }
          temp[0]+=parseFloat(gps.lati);
          temp[1]+=parseFloat(gps.longi);
          counter+=1

          latlng = new google.maps.LatLng({ lat: parseFloat( gps.lati ), lng: parseFloat(gps.longi) });
          if (oldlatlng[i]) {
            if(marker[i]){
              marker[i].setMap(null);
              circles[i].setMap(null);
              delete marker[i];
              delete circles[i]
            }
          }
          circles[i] = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: map,
            center: latlng,
            radius: parseFloat(gps.acc)

          })
          marker[i] = new google.maps.Marker({
            position: latlng,
            place: gps.rectime,
            map: map,
            title: $scope.act.group[i].character,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FF0000',
                fillOpacity: 1,
                strokeColor: '#FF0000',
                strokeWeight: 3,
                scale: 5
            }
          });
          oldlatlng[i] = latlng;


          // add gps circle
        }
      }
      if (counter!=0) {
        center = new google.maps.LatLng({lat: temp[0]/counter, lng: temp[1]/counter});
        console.log({lat: temp[0]/counter, lng: temp[1]/counter})
        map.panTo(center);
      }
        
      console.log('```````````````````````````');
    };

    rtc.reloadGroup = function(){
      var loc = window.location.pathname;
      var param = loc.split('/');
      console.log(param);
      if( param[1] != "admin" && param[2]!= "stream"){
        return;
      }
      $http.get('/adminact/' + param[3]).success(function(data){
        if(!data)
          return;
        $scope.act = data;
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
        console.log( 'reload act: ', $scope.act.name );
        
        // console.log('video updating');
        // for (var i = $scope.act.group.length - 1; i >= 0; i--) {
        //   console.log('#'+$scope.act.group[i].character);
        //   if($scope.act.group[i].stream){
        //     console.log('new stream is defined:'+$scope.act.group[i].stream);
        //     if (rtc.group[i]) {
        //       console.log('group is already exist')
        //       if( rtc.group[i].stream ){
        //         console.log('stream is already exist:'+rtc.group[i].stream)
        //         if (!$scope.oldStream[i]||!rtc.group[i].stream==$scope.oldStream[i]) {
        //           rtc.group[i] = $scope.act.group[i]
        //           console.log('video update');
        //           console.log(rtc.group[i])
        //           rtc.view( rtc.group[i].stream ); 
        //         }
        //       }else{
        //         rtc.group[i] = $scope.act.group[i]
        //         console.log('video add');
        //         rtc.view( rtc.group[i].stream ); 
        //       }
        //     }else{
        //       console.log('group is not defined')
        //       rtc.group[i] = $scope.act.group[i]
        //       console.log(rtc.group[i])
        //       rtc.view( rtc.group[i].stream );  
        //     }
        //     $scope.oldStream[i] = rtc.group[i].stream;

        //   }
        // }
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
        addPoint();
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
        if(!stream.id){
          stream = {id: stream, isPlaying: false};
          rtc.remoteStreams.push(stream);
        }
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
        if( $scope.countTime == 5){
          rtc.userReloadGroup();
          
        }else
          mytimeout = $timeout($scope.onTimeout,1000);
      };

     

      var mytimeout = $timeout( $scope.onTimeout, 1000);

      rtc.userReloadGroup = function(){
        rtc.loadData();
        rtc.reloadGroup();
        $scope.countTime = 0;
        $timeout.cancel( mytimeout );
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
