
domain = window.location.hostname + window.location.pathname;
// console.log(domain);
// console.log(document.cookie);
if(!domain.includes("google.com/search")){
  const pageHeader = `
    h3{
      color:red;
    }
    body{
      background-color: lightblue !important;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family: 'Segoe UI', Arial, Helvetica, 'Lucida Sans', sans-serif;
    }
    #info{
      display:flex;
      align-items:center;
      justify-content:center;
      flex-direction:column;
      background-color:white;
      border-radius:20px;
      padding:5px;
      word-wrap:break-word;
      width:450px;
      height:280px;
      position:absolute;
      top: 50%;
      left:50%;
      transform:translate(-50%,-50%);
      box-shadow: 0 2px 8px 2px rgba(0, 0, 0, 0.16);;
    }
    #myPara{text-align:center;}
    .myPara2{font-size:87%;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;}
    #myPara3{font-size:75%;text-align:center;}
    .genAnchor{text-decoration:none;}
    #emph{font-weight:700;}`;
  chrome.runtime.sendMessage({scanIt: domain , key:"protection_7#rr"} , function(response){
    console.log(response);
    if(response.status===true){
      // [Disabled] - Reason=> Time Complexity too high: Page load slow 
      // try{
      //   let C = document.cookie.split("; ");
      //   console.log(C);
      //   if(C.length>0){
      //     for (d = "." + location.host; d; d = ("" + d).substr(1).match(/..*$/))
      //         for (sl = 0; sl < 2; ++sl)
      //             for (p = "/" + location.pathname; p; p = p.substring(0, p.lastIndexOf('/')))
      //                 for (i in C)
      //                     if (c = C[i]) {
      //                         document.cookie = c + "; domain=" + d.slice(sl) + "; path=" + p.slice(1) + "/" + "; expires=" + new Date((new Date).getTime() - 1e11).toGMTString()
      //                     }
      //   }
      // }
      window.localStorage.clear();
      sessionStorage.clear();

      document.documentElement.innerHTML = '';

      var style = document.createElement('style');
      style.appendChild(document.createTextNode(pageHeader));

      var title = document.createElement('title');
      title.textContent = "Protected";
      document.getElementsByTagName('head')[0].appendChild(title);
      document.getElementsByTagName('head')[0].appendChild(style);

      var myDiv = document.createElement("div");
      myDiv.setAttribute("id", "info");

      var h3 = document.createElement("h3");
      h3.textContent = "A dangerous website has been blocked";

      var infoPara = document.createElement("p");
      infoPara.setAttribute("id", "myPara");
      infoPara.textContent = "You were protected from visiting this website by Malware Protection Extension.";

      var p3 = document.createElement("p");
      p3.setAttribute("id", "myPara3");
      p3.textContent = "If this website has been wrongly blocked. Reach to us: ";

      myDiv.appendChild(h3);
      myDiv.appendChild(infoPara);

      var mailAnchor = document.createElement("a");
      mailAnchor.setAttribute("class", "genAnchor");
      mailAnchor.href = "mailto:mathewnikhil432@gmail.com";
      mailAnchor.textContent = "Here";
      p3.appendChild(mailAnchor);
      myDiv.appendChild(p3);

      document.body.appendChild(myDiv);
    }
  });
}


window.addEventListener("load", perftiming, false);
function perftiming (evt) {
	    chrome.runtime.sendMessage({chrome_message: "msg", count: "0"}, function(response) {
	});
}