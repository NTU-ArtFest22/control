(function(){
  var app = angular.module('admin-act', [ 'ngAnimate', 'ui.bootstrap', 'ui.bootstrap.datetimepicker']);

  app.controller('adminActCtrl', function($scope, $window, $uibModal, $log, $http){
    var refresh = function(){
      $http.get('/admin/activitylist').success(function(res){
        console.log('================ Get activity list =================');
        console.log( res );
        $scope.actlist = res;
      });
      
    };


    refresh();

    $scope.remove = function( act_id ){
      var ans = $window.prompt( "What make you wanna remove the activity?" );
      if(ans == "green butter"){
        $window.alert( 'Going to remove it...' );
        $http.delete('/admin/activitylist/' + act_id).then(
          function(res){
            refresh();
            console.log('delete success !!!!!!!');
          }, function(err){
            console.log(err);
          });
      } else{
        $window.alert('Fail to remove the activity.');
      }
    };

    $scope.newact = function(){
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'new-act-modal.html',
        controller: 'actModalCtrl',
        //scope: $scope,
        resolve: {
          editAct: function(){
            return {};
          }
        }
      });

      modalInstance.result.then( function(){
        refresh();
        $log.info('Modal dismissed at: ' + new Date());
      });
    };

    $scope.open = function ( act ) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'edit-act-modal.html',
        controller: 'actModalCtrl',
        //scope: $scope,
        resolve: {
          editAct: function () {
            return act;
          }
        }
      });

      modalInstance.result.then( function () {
        refresh();
        $log.info('Modal dismissed at: ' + new Date());
      },function(){
        refresh();
        $log.info('Modal dismissed.');
      });
    };

  });

  /***********************************
   * actModalCtrl --- 
   *        for modal 
   *
   *** Please note that $uibModalInstance represents a modal window (instance) dependency.
   *** It is not the same as the $uibModal service used above.
   ***********************************/

  app.controller('actModalCtrl', function($scope, $http, $uibModalInstance, $window, editAct){

    var refresh_modal = function(){
      if( Object.keys( editAct ).length == 0 ) // empty json object
        return;
      $http.get('/admin/artistlist/' + editAct._id).success(function(res){
        console.log('================ Get artist list =================');
        console.log( res );
        $scope.artistlist = res; 
      });
    };

    var refresh_act = function(){
      $http.get('/admin/activitylist/' + editAct._id).success(function(res){
        console.log('============== Get activity ==============');
        console.log( res );
        $scope.act = res;
        $scope.originaltime = res.time;
      });
    };

    $scope.act = editAct;
    $scope.originaltime = editAct.time;
    $scope.isEditing = false;

    refresh_modal(); // get artistlist

    $scope.dateTimeNow = function() {
      $scope.act.time = new Date();
    };

    $scope.restore = function(){
      $scope.act.time = $scope.originaltime;
    }

    $scope.dateOptions = { showWeeks: false };

    // Disable weekend selection
    $scope.disabled = function(calendarDate, mode) {
      //return mode === 'day' && ( calendarDate.getDay() === 0 || calendarDate.getDay() === 6 );
      return false;
    };

    $scope.open = function($event,opened) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.dateOpened = true;
      console.log('opened');
    };

    $scope.dateOpened = false;
    $scope.hourStep = 1;
    $scope.format = "yyyy-MMM-dd";
    $scope.minuteStep = 10;

    $scope.showMeridian = true;
    $scope.timeToggleMode = function() {
      $scope.showMeridian = !$scope.showMeridian;
    };

    $scope.$watch("date", function(date) {
      // read date value
    }, true);

    $scope.resetMinute = function() {
      $scope.act.time.setMinutes(0);
    };

    /************ 
     * time function end 
     ************/

    $scope.remove = function( group ){
      var ans = $window.confirm('Are you sure to remove the group ' + group.character + '?');
      if( ans ){
        console.log( group.character );
        $http.delete( '/admin/activitylist/'+ $scope.act._id + '/' + group.character ).then(
          function(res){
            console.log('sucess removing group ', res);

            if( group.artist && Object.keys( group.artist ) ) {
              // remove act from user
              $http.delete( '/admin/userlist/' + group.artist.id + '/' + $scope.act._id ).then(
                function(res){ console.log('totally remove the group from user', res); }, 
                function(res){ console.log('remove act from user failed: ', res); }
              );
            }
            if( group.player && Object.keys( group.player ) ) {
              $http.delete( '/admin/userlist/' + group.player.id + '/' + $scope.act._id ).success( function(res){
                console.log(res);
              });
            }
            refresh_act();
          },
          function(res){
            console.log('error remvoing group ', res);
          }
        );
      } else {
        $window.alert('cancel to remove');
      }
    };

    $scope.edit = function( group ){
      $scope.editgroup = group; // for old group
      $scope.newgroup = group; // for new/editing group
      $scope.isEditing = true;
    };

    $scope.invite = function( character ){
      $http.get('/admin/invite/' + $scope.act._id + '/' + character).then(
        function(res){
          $window.prompt('Here is invite link: (Ctrl + c)' , 'https://ntuaf.ddns.net/register/' + $scope.act._id + '/' + res.data);
        }, function(res){
          console.log('invite failed');
        }
      );
    }

    $scope.updateGroup = function(){
      if( !$scope.newgroup.artist || Object.keys( $scope.newgroup.artist ).length == 0 ){
        $window.alert('this does not come from an exist object, please use new instead!!');
        return;
      }

      var creategroup = function(){
        var tmp = {
          "_id": $scope.act._id,
          "name": $scope.act.name,
          "character": $scope.newgroup.character,
          "artist": {
            "id": $scope.newgroup.artist._id,
            "name": $scope.newgroup.artist.fb.displayName
          }
        };

        $http.post('/admin/userlist/' + $scope.newgroup.artist._id , tmp).then(
          function(res){
            $http.put('/admin/activitylist/' + $scope.act._id + '/setgroup', $scope.newgroup).then(
              function(res){
                console.log( res );
                $scope.newgroup = {};
                $scope.editgroup = {};
                $scope.isEditing = false;
              }, function(res){ console.log('Error changing artist in act: ', res); }
            );
          }, function(res){ console.log('Error putting act into new artist: ', res); }
        );
      };

      console.log('------------------------------------------');
      console.log($scope.editgroup);
      console.log('------------------------------------------');
      if( !$scope.editgroup.artist || Object.keys( $scope.editgroup.artist ) == 0 ){
        creategroup();
      }else{
        $http.delete('/admin/userlist/' + $scope.editgroup.artist.id + '/' + $scope.act._id).then(
          function(res){
            creategroup();
          }, function(res){ console.log('Error removing act from artist: ', res); }
        );
      }
    }

    $scope.addGroup = function(){
      if( ! $scope.newgroup.artist ){
        $window.alert('Choose artist plz');
        return;
      }
      if( ! $scope.newgroup.character ){
        $window.alert('Enter character plz');
        return;
      }


      var tmp = {
        "artist": {
          "id": $scope.newgroup.artist._id,
          "name": $scope.newgroup.artist.fb.displayName
        },
        "character": $scope.newgroup.character,
        "stream": $scope.newgroup.stream,
        "gameName": $scope.act.name
      };

      $http.post('/admin/activitylist/' + $scope.act._id, tmp).then(
        function(res){ // success
          console.log(res);
          $scope.newgroup = {};
          $scope.editgroup = {};
          refresh_act();
        }, function(res){ // error
          console.log(res);
        });
    };

    $scope.deselect = function(){
      $scope.newgroup = {};
      $scope.editgroup = {};
      $scope.isEditing = false;
    };


    /*********************
     *    for new Modal 
     *********************/
    $scope.save = function () { 
      if( ! $scope.act.name ){
        console.log('no name!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        //$window.alert('Name plz..');
        return;
      }
      $http.post( '/admin/activitylist' ,  $scope.act).then(
        function(res){ // success
          console.log(res);
          $uibModalInstance.close();
        }, function(res){ // error
          console.log(res);
        });
    };

    /*********************
     *    for EDIT Modal 
     *********************/

    $scope.saveEdit = function(){
      if( ! $scope.act.name ){
        console.log('no name orz');
        return;
      }
      $http.put( '/admin/activitylist/' + $scope.act._id , $scope.act).then(
        function(res){ // success
          console.log(res);
          $uibModalInstance.close();
        }, function(res){ // error
          console.log(res);
        });
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  });



})();


