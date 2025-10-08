---
layout: default
title: Live Schedule Control Panel
permalink: /super-secret-admin-link-for-mind-matters-2025/
---

<style>
  #admin-container {
    max-width: 1200px; 
    margin: 3rem auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #333;
  }
  .admin-header h1 {
    font-size: 2.5em;
    font-weight: 700;
    text-align: center;
    margin-bottom: 0.5rem;
  }
  .admin-header .note {
    text-align: center;
    color: #777;
    margin-bottom: 3rem;
  }

  #admin-schedule-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  @media (max-width: 1000px) {
    #admin-schedule-list {
      grid-template-columns: 1fr; 
    }
  }

  .admin-day-column h2 {
    font-size: 1.8em;
    font-weight: 600;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }

  .admin-event-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 1rem;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    margin-bottom: 1rem;
    border-left: 5px solid #ccc;
    transition: box-shadow 0.2s ease, border-color 0.3s ease;
  }
  .admin-event-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .admin-event-title {
    flex-grow: 1;
    min-width: 200px;
    padding-right: 1rem;
    margin-bottom: 10px;
  }
  .admin-event-title strong {
    font-size: 1.1em;
    font-weight: 600;
  }
  .admin-event-title span {
    color: #555;
    display: block;
    font-size: 0.9em;
    margin-top: 4px;
  }

  .admin-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  .admin-time-input, .admin-status-select {
    font-size: 0.95em;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ddd;
    background-color: #f9f9f9;
  }

  .admin-event-item[data-status="Live"] { border-left-color: #28a745; }
  .admin-event-item[data-status="Delayed"] { border-left-color: #ffc107; }
  .admin-event-item[data-status="Finished"] { border-left-color: #6c757d; }
  .admin-event-item[data-status="Cancelled"] { border-left-color: #dc3545; }

  .admin-venue-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  .admin-venue-select, .admin-new-venue-input {
    font-size: 0.95em;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #ddd;
    background-color: #f9f9f9;
    flex-grow: 1;
  }
  .admin-new-venue-input {
    display: none; 
  }
  .admin-event-item {
    gap: 15px; 
  }
  .admin-time-controls { 
     display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }
  .admin-event-title{
    flex-basis: 100%;
  }
</style>

<div id="admin-container">
  <div class="admin-header">
    <h1>Schedule Control Panel</h1>
    <p class="note">Changes made here are saved instantly and will reflect on the live schedule page.</p>
  </div>
  <div id="admin-schedule-list">
    <p>Loading schedule for editing...</p>
  </div>
</div>

<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "AIzaSyAG-jdWq3RZasG27QxJQHEsY4j-jSr1J1M",
    authDomain: "dips-mind-matters.firebaseapp.com",
    databaseURL: "https://dips-mind-matters-default-rtdb.firebaseio.com",
    projectId: "dips-mind-matters",
    storageBucket: "dips-mind-matters.firebasestorage.app",
    messagingSenderId: "1048510801823",
    appId: "1:1048510801823:web:7b5f15acc614baa7b33faa"
  };

  const firebaseAdminApp = firebase.initializeApp(firebaseConfig, "adminApp");
  const database = firebaseAdminApp.database();
  const scheduleRef = database.ref('schedule');
  const adminListContainer = document.getElementById('admin-schedule-list');

  function formatDateAdmin(dateStr) {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function renderAdminList(schedule) {
    const eventsByDay = schedule.reduce((acc, event) => {
      const day = event.day || 'Day 1';
      if (!acc[day]) { acc[day] = []; }
      acc[day].push(event);
      return acc;
    }, {});
    
    let finalHtml = '';
    for (const day in eventsByDay) {
      finalHtml += `<div class="admin-day-column">`;
      finalHtml += `<h2>${day}</h2>`;
      const dayEvents = eventsByDay[day].sort((a,b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      const allLocations = [...new Set(schedule.map(e => e.location))].sort();

      dayEvents.forEach(event => {
        const originalIndex = schedule.findIndex(e => e.id === event.id);
        
        let venueOptionsHtml = '';
        allLocations.forEach(loc => {
          venueOptionsHtml += `<option value="${loc}" ${event.location === loc ? 'selected' : ''}>${loc}</option>`;
        });
        venueOptionsHtml += `<option value="--add-new--">--- Add New Venue ---</option>`;

        finalHtml += `
          <div class="admin-event-item" data-index="${originalIndex}" data-status="${event.status}">
            <div class="admin-event-title">
              <strong>${event.title}</strong>
              <span>${event.day} (${formatDateAdmin(event.date)}) @ ${event.originalStartTime ? `<del>${event.originalStartTime}</del> →` : ''} ${event.startTime} - ${event.endTime}</span>
            </div>
            <div class="admin-venue-controls">
              <select class="admin-venue-select">${venueOptionsHtml}</select>
              <input type="text" class="admin-new-venue-input" placeholder="Enter new venue name...">
            </div>
            <div class="admin-controls">
              <input type="time" class="admin-time-input start-time" value="${event.startTime}">
              <span>-</span>
              <input type="time" class="admin-time-input end-time" value="${event.endTime}">
              <select class="admin-status-select">
                <option value="Upcoming" ${event.status === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
                <option value="Live" ${event.status === 'Live' ? 'selected' : ''}>Live</option>
                <option value="Finished" ${event.status === 'Finished' ? 'selected' : ''}>Finished</option>
                <option value="Delayed" ${event.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                <option value="Cancelled" ${event.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </div>
          </div>
        `;
      });
      
      finalHtml += `</div>`;
    }
    adminListContainer.innerHTML = finalHtml;
  }
  
  function timeToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  scheduleRef.on('value', (snapshot) => { renderAdminList(snapshot.val() || []); });

  adminListContainer.addEventListener('change', function(e) {
    const eventItem = e.target.closest('.admin-event-item');
    if (!eventItem) return;

    const eventIndex = eventItem.dataset.index;
    if (eventIndex === undefined) return;

    const eventRef = database.ref(`schedule/${eventIndex}`);

    if (e.target.classList.contains('admin-time-input')) {
      const newStartTime = eventItem.querySelector('.start-time').value;
      const newEndTime = eventItem.querySelector('.end-time').value;
      
      eventRef.once('value').then((snapshot) => {
        const eventData = snapshot.val();
        
        const updates = {
          startTime: newStartTime,
          endTime: newEndTime,
        };
        
        const originalTime = eventData.originalStartTime || eventData.startTime;
        if (!eventData.originalStartTime) {
          updates.originalStartTime = eventData.startTime;
        }

        if (newStartTime !== originalTime) {
          updates.status = 'Delayed';
        } else {
          updates.status = 'Upcoming';
          updates.originalStartTime = null;
        }
        
        eventRef.update(updates);
      });
    }

    if (e.target.classList.contains('admin-status-select')) {
      eventRef.update({ status: e.target.value });
    }

    if (e.target.classList.contains('admin-venue-select')) {
      const newVenueSelect = e.target;
      const newVenueInput = eventItem.querySelector('.admin-new-venue-input');
      if (newVenueSelect.value === '--add-new--') {
        newVenueInput.style.display = 'block';
        newVenueInput.focus();
      } else {
        eventRef.update({ location: newVenueSelect.value });
        newVenueInput.style.display = 'none';
        newVenueInput.value = '';
      }
    }
  });
  adminListContainer.addEventListener('blur', function(e) {
    if (e.target.classList.contains('admin-new-venue-input') && e.target.value.trim() !== '') {
      const eventItem = e.target.closest('.admin-event-item');
      const eventIndex = eventItem.dataset.index;
      const eventRef = database.ref(`schedule/${eventIndex}`);
      eventRef.update({ location: e.target.value.trim() });
    }
  }, true);

  adminListContainer.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('admin-new-venue-input')) {
      e.target.blur(); 
    }
  });
</script>