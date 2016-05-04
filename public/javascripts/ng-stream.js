(function(){
	var app = angular.module('stream-window', [],
		function($locationProvider){$locationProvider.html5Mode(true);}
    );

    var loc = window.location.pathname;
    var param = loc.split('/');

	app.controller('RemoteStreamsController', [ '$location', '$http', '$timeout', '$scope', function($location, $http, $timeout, $scope){

    var rtc = this;
    var map, poly, oldlatlng, marker;

    window.initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: {lat:  25.017474 , lng:121.538739},
        mapTypeId: google.maps.MapTypeId.HYBRID
      });

      poly = new google.maps.Polyline({
        //geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.5,
        strokeWeight: 2
      });

      poly.setMap(map);
    };

    var addPoint = function(){
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

        });
      };


      $scope.onTimeout = function(){
        $scope.countTime++;
        if( $scope.countTime == 10){
          rtc.userReloadGroup();
          addPoint();
        }else
          mytimeout = $timeout($scope.onTimeout,1000);
      };

      var mytimeout = $timeout( $scope.onTimeout, 1000);

      rtc.userReloadGroup = function(){
        rtc.reloadGroup();
        $scope.countTime = 0;
        $timeout.cancel( mytimeout );
        mytimeout = $timeout($scope.onTimeout, 1000);
      }

    //initial load
    $scope.countTime = 0;
    rtc.reloadGroup();
  }]);

  app.controller('RemoteStreamsControllerforAdmin', ['camera', '$location', '$http', '$timeout', '$scope', function(camera, $location, $http, $timeout, $scope){

    var rtc = this;

    $scope.countTime = 0;
    rtc.group = [];

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
        
       
        console.log('~~~~~~~~~~~~~~~~~~~~~~~~~');
        addPoint();
      });
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
        rtc.reloadGroup();
        $scope.countTime = 0;
        $timeout.cancel( mytimeout );
        mytimeout = $timeout($scope.onTimeout, 1000);
      }

    //initial load
    rtc.reloadGroup();
  }]);


})();
