(function(){
  var app = angular.module('admin-user', [ 'ngAnimate', 'ui.bootstrap', 'ngRoute']);

 

  app.controller('adminUsersCtrl', function($scope, $window, $uibModal, $log, $http){
    var refresh = function(){
      //$window.alert( "IM adminUsersCtrl REFRESHHHH" );
      $http.get('/admin/userlist').success(function(res){
        $scope.userlist = res;
      });
    };
    

    refresh();

    $scope.open = function ( user ) {
      var modalInstance = $uibModal.open({
        animation: true,
        size: 'lg',
        templateUrl: 'edit-user-modal.html',
        controller: 'userModalCtrl',
        //scope: $scope,
        resolve: {
          editUser: function () {
            return user;
          }
        }
      });

      modalInstance.result.then( function () {
        refresh();
        $log.info('Modal closed at: ' + new Date());
      }, function(){
        refresh();
        $log.info('Modal dismissed.');
      });
    };

  });

  /***********************************
   * userModalCtrl --- 
   *        for modal 
   *
   *** Please note that $uibModalInstance represents a modal window (instance) dependency.
   *** It is not the same as the $uibModal service used above.
   ***********************************/

  app.controller('userModalCtrl', function($scope, $window, $http, $uibModalInstance, editUser){
    $scope.editUser = editUser;
    console.log('editUser is: ', editUser);

    var getActivitylist = function(){
      $http.get('/admin/activitylist').success(function(res){
        $scope.activitylist = res;
        console.log('------------ activity --------------');
        console.log(res);
      });
    };

    var modal_refresh = function(){
      $http.get('/admin/userlist/' + editUser._id).success(function(res){
        $scope.editUser = res;
        console.log('refresh user: ', res);
      });
    };

    getActivitylist(); // not sure put here or adminUsersCtrl
    //modal_refresh();
    //
    
    $scope.actChange = function( act ){
      $scope.grouplist = act.group;
    };

    $scope.showOption = function(group){
      return !group.player || !group.player.id ;
    }

    $scope.addActivity = function(){

      var tmp = {
        "_id": $scope.ctrl.act._id,
        "name": $scope.ctrl.act.name,
        "character": $scope.ctrl.character 
      }

      $http.post('/admin/userlist/' + editUser._id, tmp).then(function(res){

        var player = {
          "id": editUser._id,
          "name": editUser.fb.displayName
        };
        $http.put('/admin/activitylist/' + tmp._id + '/' + tmp.character, player).then(
          function(res){
            console.log(res);
          }, function(res){
            console.log(res);
          }
        );

        modal_refresh();
      }, function(err){
        console.log(err);
      });
    };

    $scope.removeActivity = function( actId ){
      var ans = $window.confirm( "Are you sure to remove the activity?" );
      if(ans){
        $http.delete('/admin/userlist/' + editUser._id + '/' + actId).then(function(res){
          console.log( 'success remove: ', res );

          /* delete user from the activity */
          $http.put('/admin/activitylist/' + actId + '/removeuser', editUser).then(
            function(res){
              modal_refresh();
              console.log('remove success');
            }, function(res){
              console.log(res);
            }
          );

        }, function(err){
          console.log(err);
        });
      }
      else{
        console.log('Cancel to remove the activity.');
      }
    };

    $scope.make = function( c ){
      var ans = $window.prompt('What makes a good ' + c + '?');
      if( ans == "green butter" ){ // the answer is only want to check if the user knows how this works!
        $window.alert('You got the answer!');

        $http.put('/admin/make' + c + '/' + editUser._id).then(
          function(res){
            modal_refresh();
          },
          function(err){
            modal_refresh();
            console.log(err);
          }
        );

      }else{
        $window.alert('Wrong answer... Please ask root admin');
      }
    };

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  });

})();

