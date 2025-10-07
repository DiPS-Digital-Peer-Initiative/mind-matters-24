const firebaseConfig = {
  apiKey: "AIzaSyAG-jdWq3RZasG27QxJQHEsY4j-jSr1J1M",
  authDomain: "dips-mind-matters.firebaseapp.com",
  databaseURL: "https://dips-mind-matters-default-rtdb.firebaseio.com",
  projectId: "dips-mind-matters",
  storageBucket: "dips-mind-matters.firebasestorage.app",
  messagingSenderId: "1048510801823",
  appId: "1:1048510801823:web:7b5f15acc614baa7b33faa"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const scheduleRef = database.ref('schedule');
const scheduleContainer = document.getElementById('schedule-container');


function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime12hr(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return '';
    let [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
}

function renderSchedule(schedule) {
  const eventsByDay = schedule.reduce((acc, event) => {
    const day = event.day || 'Day 1';
    if (!acc[day]) { acc[day] = []; }
    acc[day].push(event);
    return acc;
  }, {});

  let finalHtml = '<div class="schedule-columns">';

  for (const day in eventsByDay) {
    const dayEvents = eventsByDay[day];
    const dateStr = dayEvents[0].date;
    const dateObj = new Date(dateStr + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

    finalHtml += `<div class="schedule-column">`;
    finalHtml += `<h2 class="schedule-day-title">${day} <span class="schedule-date">(${formattedDate})</span></h2>`;
    finalHtml += '<div class="timeline">';

    dayEvents.sort((a,b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    dayEvents.forEach(event => {
      const statusClass = event.status ? event.status.toLowerCase() : 'upcoming';
      
      const locationClass = 'location--' + event.location.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') 
        .replace(/^-+|-+$/g, '');   

      const formattedStartTime = formatTime12hr(event.startTime);
      const formattedEndTime = formatTime12hr(event.endTime);
      
      let timeHtml;
      if (event.status === 'Delayed' && event.originalStartTime) {
        const formattedOriginalTime = formatTime12hr(event.originalStartTime);
        timeHtml = `<div class="timeline-time delayed-time">
                      <del>${formattedOriginalTime}</del> → <strong>${formattedStartTime} - ${formattedEndTime}</strong>
                    </div>`;
      } else {
        timeHtml = `<div class="timeline-time">${formattedStartTime} - ${formattedEndTime}</div>`;
      }

      finalHtml += `
        <div class="timeline-item status-${statusClass} ${locationClass}" id="event-${event.id}">
          <div class="timeline-card">
            ${timeHtml}
            <div class="timeline-content">
              <h3 class="timeline-title">${event.title}</h3>
              <p class="timeline-location">${event.location}</p>
            </div>
            <div class="timeline-status">${event.status}</div>
          </div>
        </div>
      `;
    });
    finalHtml += '</div>';
    finalHtml += '</div>';
  }

  finalHtml += '</div>';
  scheduleContainer.innerHTML = finalHtml;
}

scheduleRef.on('value', (snapshot) => {
  const scheduleData = snapshot.val();
  if (scheduleData) {
    renderSchedule(scheduleData);
    updateEventStatuses();
  } else {
    scheduleContainer.innerHTML = '<p>Could not load schedule data.</p>';
  }
});

function updateEventStatuses() {
    const now = new Date();
    scheduleRef.once('value', (snapshot) => {
        const scheduleData = snapshot.val();
        if (!scheduleData) return;
        scheduleData.forEach((eventData) => {
            const item = document.getElementById(`event-${eventData.id}`);
            if (!item) return;

            const manualStatus = eventData.status;
            let finalStatus = manualStatus; 

            if (manualStatus === 'Upcoming') {
                const startTime = new Date(`${eventData.date}T${eventData.startTime}`);
                const endTime = new Date(`${eventData.date}T${eventData.endTime}`);
                
                let computedStatus = 'Upcoming';
                if (now >= startTime && now < endTime) {
                    computedStatus = 'Live';
                } else if (now >= endTime) {
                    computedStatus = 'Finished';
                }
                finalStatus = computedStatus; 
            }

            const locationClass = 'location--' + eventData.location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            
            item.className = `timeline-item status-${finalStatus.toLowerCase()} ${locationClass}`;
            
            const statusElement = item.querySelector('.timeline-status');
            if(statusElement) statusElement.textContent = finalStatus;
        });
    });
}

setInterval(updateEventStatuses, 60000);