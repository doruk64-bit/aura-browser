const { app, WebContentsView } = require('electron');
const fs = require('fs');

app.whenReady().then(() => {
  console.log('Spawning Dummy WebViews...');
  // Dummy views to trigger helpers
  const dummy = new WebContentsView({});
  dummy.webContents.loadURL('https://x.com');

  setTimeout(() => {
    const metrics = app.getAppMetrics();
    fs.writeFileSync('c:\\Users\\bseester\\tarayıcı2\\metrics_dump.json', JSON.stringify(metrics, null, 2));
    console.log('Metrics dumped.');
    app.quit();
  }, 7000); // 7 seconds delay
});
