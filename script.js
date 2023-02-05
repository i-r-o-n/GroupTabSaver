let exampleData= [{  
  tabinfo:
  {collapsed: true, color: 'grey', id: 1863213974, title: 'news', windowId: 727675506},
tabs:
  [{
    "active": false,
    "audible": false,
    "autoDiscardable": true,
    "discarded": false,
    "favIconUrl": "https://www.washingtonpost.com/favicon.svg",
    "groupId": 1863213974,
    "height": 675,
    "highlighted": false,
    "id": 727675509,
    "incognito": false,
    "index": 0,
    "mutedInfo": {
        "muted": false
    },
    "pinned": false,
    "selected": false,
    "status": "complete",
    "title": "The Washington Post - Breaking news and latest headlines, U.S. news, world news, and video - The Washington Post",
    "url": "https://www.washingtonpost.com/?reload=true&_=1675541546697",
    "width": 1128,
    "windowId": 727675506
  },
    {
    "active": false,
    "audible": false,
    "autoDiscardable": true,
    "discarded": false,
    "favIconUrl": "",
    "groupId": -1,
    "height": 675,
    "highlighted": false,
    "id": 727675535,
    "incognito": false,
    "index": 3,
    "mutedInfo": {
        "muted": false
    },
    "pinned": false,
    "selected": false,
    "status": "complete",
    "title": "Extensions",
    "url": "chrome://extensions/?errors=jlgdllpfiididohdhdpebpmaogkahijk",
    "width": 1128,
    "windowId": 727675506
  }
  
  ]
}]

const storiesDiv = document.querySelector('#stories');

const storyNode = (story) => {
  var template = document.createElement('template');
  template.innerHTML = story;
  return template.content.childNodes[0];
}

const addStories = (stories) => {
  for (let index in stories) {
    const story = stories[index];
    const html = `<div class="story">
      <a href="${story.url}">${story.title}</a>
    </div>`;
    storiesDiv.appendChild(storyNode(html));
  }
}

// if (localStorage.lastFetch && localStorage.tabs && (new Date() - localStorage.lastFetch) < (1000*60*60)) {
//   addStories(JSON.parse(localStorage.stories));
// } else {
//   if (localStorage.stories) {
//     addStories(JSON.parse(localStorage.stories));
//   }

//   fetch('https://api.hackernoon.com/featured-stories',{
//       method: 'GET',
//       mode: 'no-cors',
//       // headers:{},
//       credentials: 'include'
//     })
//     .then(response => response.json())
//     .then(data => {
//       if (!localStorage.stories) {
//         addStories(data);
//       }

//       localStorage.setItem("stories", JSON.stringify(data));
//       localStorage.setItem("lastFetch", new Date()-1);
//     });
// }
 

const time = document.getElementById('clockTimeSpan');
const date = document.getElementById('clockDate');
const hand = document.getElementById('seccondHand');
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function timeSet() {
  let d = new Date();
  let s = d.getSeconds();
  let m = d.getMinutes();
  let h = d.getHours();
  let angle =  s*6 +180;
  time.innerText = 
    ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) ;

  
  let rotate = "rotate(" +angle + "deg" +") ";
  
  hand.style.transform = "translate(" +Math.sin(angle * Math.PI / 180) * -110+"px,"+ Math.cos(angle * Math.PI / 180) * 110+"px) " + rotate;
  
  let month = months[d.getMonth()];
  date.innerText = month + " "+ d.getDate() + ", " + d.getFullYear();
}
timeSet();
setInterval(() => timeSet(),1000);

let userData = {};

const newGroupsEl = document.getElementById('newGroups');
function getTabs() {
  //imploment getting from extention
  exampleData.forEach(element => {
    const newGroup = document.createElement("div");
    newGroup.classList.add("tabGroup");
    newGroup.innerHTML = `
        <div class="groupName">
          ${tabinfo.title}
          <img src="/openIcon.svg">
        </div>
  
        <ul class="tabList">
          <li>
            <img src="https://www.ads.com/favicon.svg">
            <a href="https://hackernoon.com/building-a-new-tab-chrome-extension-with-zero-dependencies-5zlh3ue6">https://hackernoon.com/building-a-new-tab-chrome-extension-with-zero-dependencies-5zlh3ue6</a>
          </li>
          <li>
            <img src="https://www.ads.com/favicon.svg">
            <a href="https://www.w3schools.com">https://www.w3schools.com</a>
          </li>

          
        </ul>
      `;
    newGroupsEl.appendChild(para);
  })
}
getTabs();