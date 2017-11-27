var myApp = new Framework7({
    modalTitle: 'Framework7',
    material: true,
});

var $$ = Dom7;

var mainView = myApp.addView('.view-main', {
});
// var rightView = myApp.addView('.view-right', {
//     name: 'right'
// });

var globRedSelect = {
	url:"",
	img:""
};

// database Management 
var db = openDatabase('RedditDB', '1.0', 'Reddit DB', 2 * 1024 * 1024);
var selectedReddits = [];
(function(){
	db.transaction(function (tx) {  
   		tx.executeSql('CREATE TABLE IF NOT EXISTS Reddits (name)');
   		tx.executeSql('CREATE TABLE IF NOT EXISTS Favourites (id unique,title,thumbnail,dt,img,desc)');
   		tx.executeSql('SELECT * FROM Reddits', [], function (tx, results) {
   			leftPanelGenerate(data);
   			var len = results.rows.length, i;
   			for (i = 0; i < len; i++){
         		selectedReddits.push(results.rows.item(i).name);
      		}
   		}, null);
	});
})();


function leftPanelGenerate() {
	var data = "";
	for (var i = 0; i < selectedReddits.length; i++){
		var name = selectedReddits[i];
		
		data += '<li><a href="#" onclick="fetchSubreddit(\''+ name +'\');" class="item-link close-panel">' +
		 '  <div class="item-content">' +
		 '    <div class="item-inner">' +
		 '      <div class="item-title">'+ name +'</div>' +
		 '    </div>' +
		 '</div></a></li>'; 	        
	}
	document.getElementById("reddit-holder").innerHTML = data;	
}

const actionSheetButtons = [
    [
        {
            text: 'Choose some action',
            label: true
        },
        {
            text: 'Save',
            onClick: function (e) {
            	console.log("Clicked ",e);
                myApp.alert(globRedSelect.img);
            }
        },
        {
            text: 'Share',
            onClick: function () {
                myApp.alert(globRedSelect.img);
            }
        },
        {
            text: 'Visit on reddit',
            color: 'red',
            onClick: function () {
                myApp.alert(globRedSelect.url);
            }
        },
    ],
    [
        {
            text: 'Cancel'
        }
    ]
];
myApp.onPageInit('index modals media-lists', function (page) {
	console.log(page);
	attachActionSheetToElements(page);
});

myApp.onPageInit('addnew', function (page) {
	$$('#addNewRedditBtn').on('click', function () {
		addNewReddit();
	});	
	function addNewReddit() {
        myApp.prompt('Enter topic', function (data) {
        	data = data.trim();
        	if(data.length < 1){
        		myApp.alert('Please enter valid reddit topic name!');
        	} else {
        		fetchSubRedditNames(data,"innerSubRedditData");
        	}
    	});		
	}
});
function submitReddit() {
	alert("");
	var chkboxes = document.getElementsByName("redditnames");
	db.transaction(function (tx) {
		var flag = true;
		for(var i=0;i<chkboxes.length;i++) {
			if(chkboxes[i].checked) {
				for(var j=0;j<selectedReddits.length;j++) {
					if(selectedReddits[j] === chkboxes[i].value) {
						flag = false;
						break;
					}
				}
				if(flag) {
					tx.executeSql('INSERT INTO Reddits (name) VALUES ("'+ chkboxes[i].value +'")');
					selectedReddits.push(chkboxes[i].value);
				}
				flag = true;
			}
		}
	});
	myApp.alert("Added Successfully!");
	Dom7(".back").click();
}


function attachActionSheetToElements(){
    $$('.demo-actions').on('click', function (e) {
        myApp.actions(actionSheetButtons);
    });
    $$('.demo-actions-popover').on('click', function (e) {
    	console.log(e);
    	globRedSelect.url = e.target.dataset.url;
    	globRedSelect.img = e.target.dataset.img;
        myApp.actions(e, actionSheetButtons);
    });	
}


var entriesEl = document.querySelector('#entries');

function fetchSubreddit(url) {
  if (url) {
    fetch('https://www.reddit.com/r/' + url + '.json').then(function(response) {
      return response.json();
    }).then(function(json) {
    	console.log(json);
      var links = '';
      for (var i = 0; i < json.data.children.length; i++) {
        links += cardTemplateGenerator(json.data.children[i].data);
      }
      entriesEl.innerHTML = links;
      attachActionSheetToElements();
    });
  }
}


function fetchSubRedditNames(name,id) {
	var menuEl = document.querySelector('#'+id);
	var subredditsByTopicUrl = 'https://www.reddit.com/api/subreddits_by_topic.json?query='+name;
	fetch(subredditsByTopicUrl).then(function(response) {
	  return response.json();
	}).then(function(json) {
	  var select = document.createElement('select');
	  var links = '';
	  if(json.length < 1) {
	  	menuEl.innerHTML = '<div class="content-block"><p>No Sub-reddits found.</p></div>';
	  	return;
	  }
	  for (var k = 0; k < json.length; k++) {
	    // links += '<option value="' + json[k].name + '">' + json[k].name +
	    //   '</option>';
	    links +='<li>'+
				'	<label class="label-checkbox item-content">'+
				'		<input type="checkbox" name="redditnames" value="'+json[k].name+'" checked="checked">'+
				'		<div class="item-media"><i class="icon icon-form-checkbox"></i></div>'+
				'		<div class="item-inner">'+
				'			<div class="item-title">'+json[k].name+'</div>'+
				'		</div>'+
				'	</label>'+
				'</li>';
	  }
	  // select.innerHTML = links;
	  // select.addEventListener('change', function(e) {
	  //   fetchSubreddit(e.target.value);
	  // });
	  menuEl.innerHTML = '<div class="list-block"><ul>' + links + '</ul>'+
							'<div class="content-block">' +
							'	<p class="buttons-row">' +
							'		<a href="#" id="submitRedditBtn" class="button button-fill button-raised">Add</a>' +
							'		<a href="#" id="clearRedditBtn" class="button button-raised">Clear</a>' +
							'	</p>' +
							'</div>' +
						'</div>';
      $$('#submitRedditBtn').on('click', function () {
		submitReddit();
	  });	
	  $$('#clearRedditBtn').on('click', function () {
		menuEl.innerHTML = "";
	  });							
	}).catch(function(ex) {
	  ChromeSamples.log('Parsing failed:', ex);
	});	
}



function cardTemplateGenerator(data){
	console.log(data);
	var title = data.title;
	var author = data.author;
	var date = new Date(1511738418);
	var image = "";
	var imageRegex = /([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/i;
	if(imageRegex.test(data.url)) {
		image = '<img src="'+data.url+'" width="100%"/>';
	}
	var avatar = '<img src="http://lorempixel.com/68/68/people/1/" width="34" height="34">';
	if(imageRegex.test(data.thumbnail)){
		avatar = '<img src="'+ data.thumbnail +'" width="34" height="34">';
	}
	return '<div class="card ks-facebook-card">'+
	'<div class="row">'+
	'<div class="card-header no-border">'+
	'<div class="ks-facebook-avatar">'+avatar+'</div>'+
	'<div class="ks-facebook-name">'+ author +'</div>'+
	'<div class="ks-facebook-date">Monday at 3:47 PM</div>'+
	'</div>'+
	'<div class="col-15" style="text-align:center;padding-top:8px;"><a href="#" class="demo-actions-popover"><img data-url="" data-img="'+data.url+'" style="width:20px" src="assets/moreicon.png"></a></div>'+
	'</div>	'+
	'  <div class="card-content">'+
	'    <div class="card-content-inner">'+
	'      '+ image + '<p>'+ title +'</p>' +
	'    </div>'+
	'  </div>'+
	'</div>';
}

