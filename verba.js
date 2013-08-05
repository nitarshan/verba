var jade = require('jade')
  , fs = require('fs');

function Verba(postPath) {
	this.posts_ordered = [];
	this.post_titles = {};
	this.post_tags = {};

	this.postNotFound = [{
			date: '',
			filename: 'PostNotFound',
			title: 'Post not found',
			body: "The post you are looking for doesn't seem to exist...",
			tags: []
		}];
	this.tagNotFound = [{
			date: '',
			filename: 'TagNotFound',
			title: 'Tag not found',
			body: "It appears that no posts have that tag...",
			tags: []
		}];

	this.init(postPath);
}

Verba.prototype.init = function(postPath){
	var that = this;
	this.postPath = postPath;
	var filenames = fs.readdirSync(postPath);
	var metadataregex = /METADATA_START(\{[\s\S]+?\})METADATA_END/;
	var dateregex = /([0-9])(st|nd|rd|th)/;

	// Obtain all file data and store in posts_ordered
	filenames.forEach(function(element, index, array){
		var data = fs.readFileSync(postPath+element, 'utf8');
		var metadata = metadataregex.exec(data);

		var postjson = JSON.parse(metadata[1]);
		postjson.body = jade.compile(data.replace(metadata[0], ''))({});
		postjson.datetime = new Date(postjson.date.replace(dateregex, "$1,"));
		postjson.filename = element.replace('.jade', '');

		that.posts_ordered.push(postjson);
	});

	// Sort the stored posts chronologically
	that.posts_ordered.sort(function(a,b){
		return +a.datetime < +b.datetime;
	});

	// Map filenames to posts and add posts to this.post_tags
	that.posts_ordered.forEach(function(element, index, array){
		that.post_titles[element.filename] = index;

		element.tags.forEach(function(tag_element, tag_index, tag_array){
			if(that.post_tags[tag_element]){
				that.post_tags[tag_element].push(element.filename);
			}
			else{
				that.post_tags[tag_element] = [element.filename]
			}
		})
	});

	console.log("Verba initialization complete");
};

Verba.prototype.postStats = function(){

};

Verba.prototype.allposts = function(){
	return this.posts_ordered
};

Verba.prototype.singlepost = function(postname){
	var post = [this.posts_ordered[this.post_titles[postname]]];
	if(post[0] === undefined){
		return this.postNotFound;
	}

	return post;
};

Verba.prototype.tagposts = function(tag){
	var that = this;
	var selectnames = this.post_tags[tag];
	var selectlist = [];
	if(selectnames !== undefined){
		selectnames.forEach(function(element, index, array){ selectlist.push(that.posts_ordered[that.post_titles[element]]) });
		selectlist.sort(function(a,b){ return a.datetime < b.datetime });
	}
	else{
		return this.tagNotFound;
	}

	return selectlist;
};

module.exports = function(postPath) {
	return new Verba(postPath);
};