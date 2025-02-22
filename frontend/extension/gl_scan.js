const urlSet = new Set();
let urls = document.getElementsByTagName("a");
var backupUrls = urls;
let urlArr = Array.from(urls);
for(var i=0;i<urls.length;i++){
	urlSet.add(urls[i].href.split("/")[2]);
}
for(var i=0;i<urlArr.length;i++){
	urlArr[i] = urlArr[i].href.split("/")[2];
}
// console.log(urlSet);
urlSet.forEach(url =>{
	if(url=== undefined || ( url!==undefined && (url.includes("www.google.com")||url.includes("maps.google.com")||url.includes("accounts.google.com")||url.includes("policies.google.com")))){urlSet.delete(url);}
});
// console.log(urlSet);
const path_unsafe  = chrome.runtime.getURL("extension/icons/cross.png");
const imgUnsafe = document.createElement("img");
imgUnsafe.src = path_unsafe;
imgUnsafe.style.width = "18px";
imgUnsafe.style.height = "18px";

const path_safe  = chrome.runtime.getURL("extension/icons/tick.png");
const imgSafe = document.createElement("img");
imgSafe.src = path_safe;
imgSafe.style.width = "18px";
imgSafe.style.height = "18px";

function checkVal(val) {
  for(var i=0;i<urls.length;i++){
  	if(urls[i]!==undefined && urls[i].href.includes(val)){
    	return i;
  	}
  }
}
chrome.runtime.sendMessage([...urlSet] , function(response){
	const resultVir = response;
	// console.log(resultVir);
	for (var i = 0; i < resultVir.length; i++) {
		let lookUp = resultVir[i].split(' ');
		var indx = checkVal(lookUp[0]);
		if(lookUp[1]==="true"){
			urls[indx].insertAdjacentHTML("beforeend",`&nbsp;`+imgUnsafe.outerHTML);
		}
		else if(lookUp[1]==="false"){
			urls[indx].insertAdjacentHTML("beforeend",`&nbsp;`+imgSafe.outerHTML);
		}
	}
	console.log("[FindPhish Extension]: Scan Status displayed");
});