var myapp = angular.module("myTodoApp", ["storage"]);

myapp.controller("myHomeCtrl", function($scope,menuDatas,categoryDatas,blogcontentData) {
      
    $scope.searchVal="";
    $scope.category="";

    menuDatas.getMenuDatas().then(function(data){ 
    	$scope.menus = data;
    })
    categoryDatas.getPageDatas().then(function(data){ 
    	$scope.categorys = data;
    //	console.log(data);
    	for(var i=0;i< data.dataList.length;i++ ){
	    	blogcontentData.getBlogData($scope.categorys.dataList[i].url,i).then(function(data){
	    		var content = data.data;
				if($(content).text().length > 400)
		    		content = $(content).text().substr(0,400)+"[...]";
		    	else
		    		content = $(content).text();  
		    	$scope.categorys.dataList[data.i].content = content;
		    //	console.log($scope.categorys)
	    	}); 
	    } 
    }) 
    categoryDatas.getCategoryDatas().then(function(data){
    //	console.log(data);
    	$scope.categroupdatas = data
    });


    $scope.search = function(pageIndex,pageUnit,pageSize){

 		if($scope.categorys!=null && $scope.categorys.pageIndex == pageIndex) return;

    	categoryDatas.getPageDatas($scope.searchVal,$scope.category,pageIndex,pageUnit,pageSize).then(function(data){ 
	    	$scope.categorys = data;
	    	for(var i=0;i< data.dataList.length;i++ ){
		    	blogcontentData.getBlogData($scope.categorys.dataList[i].url,i).then(function(data){
		    		var content = data.data;
					if($(content).text().length > 400)
			    		content = $(content).text().substr(0,400)+"[...]";
			    	else
			    		content = $(content).text();  
			    	$scope.categorys.dataList[data.i].content = content;
			    //	console.log($scope.categorys)
		    	}); 
		    } 
	    })
    }

    $scope.onCate = function(val){
    	$scope.category = val;
    	$scope.search();
    }

    $scope.goRead = function(url){
    	location.href = "/zhgblog.html?url="+url;
    }
    
});

myapp.controller("myBlogCtrl", function($scope,menuDatas,blogcontentData) {
    menuDatas.getMenuDatas().then(function(data){ 
    	$scope.menus = data; 
    }) 
    var qurl = location.search.substr(5); 

    blogcontentData.getBlogData(qurl).then(function(data){ 
		$("#zhgblogcontent").html(data.data);
	}); 

});
 
myapp.controller("myAboutmeCtrl", function($scope,menuDatas) {
    menuDatas.getMenuDatas().then(function(data){ 
    	$scope.menus = data;
    })
});


myapp.service('menuDatas', function($http,$q,storage) {

	this.datas = new Array(); 

    this.getMenuDatas = function () { 

    	var d = $q.defer();
 

    	if(this.datas.length==0){ 
    		if(storage.all("menus").length==0){
		    	$http.get("/data/menu.json").then(function (response) { 
		    		this.datas = response.data; 
		    		storage.save("menus",response.data);
		    		d.resolve(this.datas); 
			    });
		    }else{
		    	this.datas = storage.all("menus");
		    	d.resolve(this.datas); 
		    }
	    }else{  
	    	d.resolve(this.datas); 
	    }
 		return d.promise;
    }
});

myapp.service('categoryDatas', function($http,$q,storage) {

	this.datas = new Array(); 
	 
	var pIndex = 1;
	var pSize = 5;
	var pUnit = 10; 


	var categoryGroupCount = function(datas){
    	var map = new Map();
    	for(var i=0;i<datas.length;i++){
    		var cate = datas[i].category;
    		if(map.get(cate)!=null && map.get(cate)!=undefined && map.get(cate)>0 ) map.set(cate,map.get(cate)++);
    		else map.set(cate,1);
    	}
    	return fn_maptojsonarr(map);
    }
    var fn_maptojsonarr = function(m){
    	var arr = new Array();
    	m.forEach(function (item, key, mapObj) { 
    		//var json = '{"'+key+'":"'+item.toString()+'"}'
    		arr.push( { name:key,count:item.toString() } ); 
		});
		return arr;
    }

    this.getCategoryDatas = function () { 
    	var d = $q.defer();
    	if(this.datas.length==0){
    		if(storage.all("articles").length==0){
		    	$http.get("/data/articles.json").then(function (response) { 
		    		this.datas = response.data;  
		    		storage.save("articles",response.data);   
		    		d.resolve(categoryGroupCount(this.datas));

			    }); 
		    }else{
		    	this.datas = storage.all("articles");
		    	d.resolve(categoryGroupCount(this.datas)); 
		    }
	    }else{ 
	    	d.resolve(categoryGroupCount(this.datas));
	    } 
	    return d.promise;
    }
    


    var getDatas = function(searchVal,category,pageIndex,pageUnit,pageSize,tmpdatas){
 

    	if(pageIndex!=null && pageIndex != undefined && pageIndex > 0 ) pIndex = pageIndex;
    	if(pageUnit!=null && pageUnit != undefined && pageUnit > 0) pUnit = pageUnit
    	if(pageSize!=null && pageIndex != undefined && pageIndex > 0) pSize = pageSize;
    	 

    	var data;
    	var selectdatas = new Array();
    	for(var i=0; i < tmpdatas.length;i++){
    		data = tmpdatas[i]; 
    		if(searchVal != null && searchVal != undefined && searchVal != ""){
    			if(category != null && category != undefined && category != ""){
    				if(data.title.indexOf(searchVal) > -1 && data.category.indexOf(category) > -1 ){
    					selectdatas.push(data);
    				}
    			}else{
    				if(data.title.indexOf(searchVal) > -1){
    					selectdatas.push(data);
    				}
    			}
    		}else{
				if(category != null && category != undefined && category != ""){
					if(data.category.indexOf(category) > -1)
						selectdatas.push(data);
				}else{ 
					selectdatas.push(data);;
				}
    		} 
    	}
    	 

    	var startIndex = pUnit*(pIndex-1);
    	var endIndex = startIndex+pUnit; 
    	var reldatas = new Array(); 

    	if(selectdatas.length < endIndex) endIndex = selectdatas.length;
  
    	for(var i=startIndex;i<endIndex;i++)
    		reldatas.push(selectdatas[i]);

    	var lastIndex = (reldatas.length / pUnit ) + 1;
    	var u = parseInt(pSize/2) 
    	
    	var endIndex = pIndex+u;
    	if(endIndex>lastIndex) endIndex = lastIndex;
    	var beginIndex = pIndex-u*2;
    	if(beginIndex<1) beginIndex = 1;

    	var pageSizeList = new Array();
    	for(var i=beginIndex;i<=endIndex;i++)
    		pageSizeList.push(i);
  //  	console.log(pageSizeList);
    	var reljson = {
    		"dataList" : reldatas
    		,"pageIndex": pIndex
    		,"totalCount" : selectdatas.length
    		,"lastIndex" : parseInt(lastIndex)
    		,"pageSizeList" : pageSizeList 
    	} 
   // 	console.log(reljson);

    	return reljson;
    }

    this.getPageDatas = function(searchVal,category,pageIndex,pageUnit,pageSize){

    	var d = $q.defer();
    	var reljson = {};
    	if(this.datas.length==0){
    		if(storage.all("articles").length==0){
		    	$http.get("/data/articles.json").then(function (response) { 
		    		this.datas = response.data;   
		    		storage.save("articles",response.data);  
	  				d.resolve(getDatas(searchVal,category,pageIndex,pageUnit,pageSize,this.datas));
			    });
		    }else{
		    	this.datas = storage.all("articles");  
	  			d.resolve(getDatas(searchVal,category,pageIndex,pageUnit,pageSize,this.datas));
		    }
	    }else{
	    	d.resolve(getDatas(searchVal,category,pageIndex,pageUnit,pageSize,this.datas)); 
	    } 
	    return d.promise;
    }

});

myapp.service('blogcontentData', function($http,$q,storage) {
  
    this.getBlogData = function (url,i) {  
    	var d = $q.defer();
    	var rel = { "i":i} 
    	if(storage.one(url)==null){
	    	$http.get(url).then(function (response) { 
	    		rel.data = response.data;   
	    		storage.save(url,rel.data);
	    		d.resolve(rel);
		    }); 
	    }else{
	    	rel.data = storage.one(url);   
	    	d.resolve(rel);
	    }
	    return d.promise;
    }  
});

angular.module('storage', [])
.factory('storage', function() {
  return {
    all: function(key) {
      var news = window.localStorage[key];
      if(news) {
        return angular.fromJson(news);
      }
      return new Array();
    }
    ,one:function(key){
      var news = window.localStorage[key];
      if(news) {
        return angular.fromJson(news);
      }
      return null;
    }
    ,save: function(key,value) {
      window.localStorage[key] = angular.toJson(value);
    },
    clear: function(key) {
      window.localStorage.removeItem(key);
    }
  }
})
