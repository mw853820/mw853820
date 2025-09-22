function doPost(e) {
  var sheetName = e.parameter.sheet || "Recommendations";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (sheetName === "Timeline") {
    // Save uploaded image to Google Drive
    var folder = DriveApp.getFolderById("YOUR_DRIVE_FOLDER_ID"); // create a folder in Drive and paste its ID
    var blob = e.parameter.file ? Utilities.base64Decode(e.parameter.file, Utilities.Charset.UTF_8) : null;
    var fileUrl = "";

    if (blob) {
      var contentType = e.parameter.filetype;
      var filename = e.parameter.filename;
      var newFile = folder.createFile(blob, filename, contentType);
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = newFile.getUrl();
    }

    sheet.appendRow([
      new Date(),
      e.parameter.eventName,
      e.parameter.day,
      e.parameter.month,
      e.parameter.year,
      e.parameter.summary,
      e.parameter.link,
      fileUrl
    ]);
  } else if (sheetName === "Recommendations") {
    sheet.appendRow([
      new Date(),
      e.parameter.title,
      e.parameter.date,
      e.parameter.organization,
      e.parameter.type,
      e.parameter.status,
      e.parameter.actionDate,
      e.parameter.description
    ]);
  }

  return ContentService.createTextOutput("Success");
}

function doGet(e) {
  var sheetName = e.parameter.sheet || "Recommendations";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var rows = sheet.getDataRange().getValues();
  var data = [];

  if (sheetName === "Timeline") {
    for (var i=1; i<rows.length; i++) {
      data.push({
        timestamp: rows[i][0],
        eventName: rows[i][1],
        day: rows[i][2],
        month: rows[i][3],
        year: rows[i][4],
        summary: rows[i][5],
        link: rows[i][6],
        imageUrl: rows[i][7]
      });
    }
  } else if (sheetName === "Recommendations") {
    for (var i=1; i<rows.length; i++) {
      data.push({
        timestamp: rows[i][0],
        title: rows[i][1],
        date: rows[i][2],
        organization: rows[i][3],
        type: rows[i][4],
        status: rows[i][5],
        actionDate: rows[i][6],
        description: rows[i][7]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
