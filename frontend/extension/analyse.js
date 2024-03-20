// const fetchDocumentData = () => {
  document.getElementById("report-btn").onclick = () => {
    console.log("onclick")
  chrome.runtime.sendMessage({ method: "clear" }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: getDocumentInfo,
        },
        () => {
          if (chrome.runtime.lastError) {
            document.getElementById("base-url").value =
              "Error: " + chrome.runtime.lastError.message;
          } else {
            chrome.runtime.sendMessage({ method: "get" }, (response) => {
              console.log("going to dataToPopup")
              dataToPopup(response);
            });
          }
        }
      );
    });
  });
};

// fetchDocumentData();

// Detecting XSS
function detectXSS() {
  const scripts = document.querySelectorAll("script");
  const suspiciousScripts = [];

  scripts.forEach(script => {
    const scriptContent = script.textContent.trim();
    if (scriptContent.includes("<script") || scriptContent.includes("javascript:")) {
      suspiciousScripts.push(script);
    }
  });

  return suspiciousScripts;
}

async function getDocumentInfo() {

  console.log("getDocumentInfo")

  // get performance parameters
  const getPerformance = () => {
    try {
      let perfObject = {};
      let { timing, timeOrigin } = JSON.parse(JSON.stringify(window.performance));
      perfObject.domCompleted = (timing.domComplete - timeOrigin)/1000; // ms to s
      perfObject.connectTime = (timing.connectEnd - timing.connectStart)/1000; //ms to s
      perfObject.domContentEvent = (timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart)/1000; //ms to s
      perfObject.responseTime = (timing.responseEnd - timing.requestStart)/1000; // ms to s
      perfObject.unloadEvent = (timing.unloadEventEnd - timing.unloadEventStart)/1000; // ms to s
      perfObject.domInteractive = (timing.domInteractive - timeOrigin)/1000; // ms to s
      perfObject.redirectTime = (timing.redirectEnd - timing.redirectStart)/1000; // ms to s

      return perfObject;
    } catch (error) {
      return error;
    }
  }

  // const getImageAltText = () => {
  //   try {
  //     let imagesWithoutAlt = [];
  //     let nodeList = document.getElementsByTagName("img");
  //     let totalImages = nodeList.length;

  //     for (let i = 0; i < nodeList.length; i++)
  //     {
  //       let altText = nodeList[i].alt.length > 0 ? true : false;
  //       if(!altText) {
  //         imagesWithoutAlt.push(nodeList[i].src)
  //       }
  //     }

  //     return { totalImages, imagesWithoutAlt };
  //   } catch (error) {
  //     return false;
  //   }
  // }

  const getOGTags = () => {
    try {
      let ogTags = false;
      let nodeList = document.querySelectorAll("meta[property]");

      for (let i = 0; i < nodeList.length; i++)
      {
        let isOgTag = nodeList[i].getAttribute('property').includes('og');
        if(isOgTag) {
          ogTags = true;
        }
      }

      return ogTags;
    } catch (error) {
      return false;
    }
  }

  const getSSL = () => {
    try {
      let content = document.location.protocol
      let included = content.includes('https');

      if(included) return true;
      else return false;
    } catch (error) {
      return false;
    }
  }

  // Performance Parameter
  let performanceObject = getPerformance();

  console.log({performanceObject});

  // Base URL
  let baseUrl = document.baseURI;

  // // Alt Text of Images
  // let images = getImageAltText();

  // Open Graph Tags
  let ogTags = getOGTags();

  // SSL Certificate
  let ssl = getSSL();

  // domain 
  let domain = document.domain;

  let keyPoints = { performanceObject, ssl, ogTags, domain }

  let dataObject = { baseUrl, keyPoints }

  console.log("dataObject")

  chrome.runtime.sendMessage({ method: "set", value: dataObject }, () => {});
}

function dataToPopup(response) {

  const { keyPoints, baseUrl } = response.value;

  console.log("datatopopup")

  // document.getElementById("report-btn").style.display = "none";
  // document.getElementById("main-wrapper").style.display = "block";
  // document.getElementById("logo").style.marginTop = "5%";
  // document.getElementById("logo").style.marginBottom = "5%";

  document.getElementById("base-url").innerHTML = baseUrl;

  // Detect XSS vulnerabilities and display them
  const detectedXSS = detectXSS();
  if (detectedXSS.length > 0) {
    const xssList = document.createElement("ul");
    detectedXSS.forEach(script => {
      const listItem = document.createElement("li");
      listItem.textContent = script.outerHTML;
      xssList.appendChild(listItem);
    });
    document.getElementById("detected-xss").classList.add("error-mark")
    document.getElementById("detected-xss").appendChild(xssList);
  } else {
    document.getElementById("detected-xss").classList.add("success-mark")
    document.getElementById("detected-xss").textContent = "No malicious script vulnerabilities detected.";
  }

  // Images without alt text
  // document.getElementById("site-alt-text").innerHTML = keyPoints.images.totalImages;
  // if(keyPoints.images.imagesWithoutAlt.length > 0) {
  //   document.getElementById('images-withuot-alt').classList.add("error-mark")
  //   document.getElementById("images-withuot-alt").innerHTML = keyPoints.images.imagesWithoutAlt.length + " ALT attributes are empty or missing.";

  //   const div = document.getElementById('images-withuot-alt');
  //   const ul = document.createElement("ul");
  //   ul.setAttribute("id", "image-list");

  //   for (let i = 0; i < keyPoints.images.imagesWithoutAlt.length; i++) {
  //     const li = document.createElement("li");
  //     li.innerHTML = keyPoints.images.imagesWithoutAlt[i];
  //     li.setAttribute("class", "image-list-item")
  //     ul.appendChild(li);
  //   }

  //   div.appendChild(ul);

  // } else {
  //   document.getElementById('images-withuot-alt').classList.add("success-mark")
  //   document.getElementById("images-withuot-alt").innerHTML =  "Good, Every images have alt attributes.";
  // }

  // SSL Enabled
  if (keyPoints.ssl) {
    document.getElementById("site-ssl").classList.add("success-mark")
    document.getElementById("site-ssl").innerHTML = "You are viewing SSL enabled website.";
  } else {
    document.getElementById("site-ssl").classList.add("error-mark")
    document.getElementById("site-ssl").innerHTML = "Oops, Your website has not been SSL enabled.";
  }

  document.getElementById("site-domain").innerHTML = keyPoints.domain;
  let date = new Date();
  document.getElementById("current-date").innerHTML = date.toLocaleString();

  // Performance Matrix
  if(keyPoints.performanceObject) {
    const { performanceObject } = keyPoints;
    document.getElementById("performance-dom-completed").innerHTML = performanceObject.domCompleted + "s";
    document.getElementById("performance-connect-time").innerHTML = performanceObject.connectTime + "s";
    document.getElementById("performance-dom-content").innerHTML = performanceObject.domContentEvent + "s";
    document.getElementById("performance-response-time").innerHTML = performanceObject.responseTime + "s";
    document.getElementById("performance-unload-event").innerHTML = performanceObject.unloadEvent + "s";
    document.getElementById("performance-dom-interactive").innerHTML = performanceObject.domInteractive + "s";
    document.getElementById("performance-redirect-time").innerHTML = performanceObject.redirectTime + "s";
  }
}

