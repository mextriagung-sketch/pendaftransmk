/**
 * Google Apps Script for SMK N 1 Lalan Registration
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Click "Deploy" > "New Deployment".
 * 5. Select "Web App".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone".
 * 8. Click "Deploy" and copy the Web App URL.
 * 9. Paste the URL into your VITE_APPS_SCRIPT_URL environment variable in AI Studio.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var major = data.major;
    
    // Get or create sheet for the major
    var sheet = ss.getSheetByName(major);
    if (!sheet) {
      sheet = ss.insertSheet(major);
      sheet.appendRow([
        "Nama Lengkap", 
        "NISN", 
        "Tempat Lahir", 
        "Tanggal Lahir", 
        "No. HP", 
        "Alamat", 
        "Asal Sekolah", 
        "Nama Ayah", 
        "Nama Ibu", 
        "Ijazah",
        "Copy NISN",
        "Rapor",
        "KK",
        "Akte",
        "KTP Ortu",
        "KIP",
        "Sertifikat",
        "Foto",
        "Tanggal Daftar"
      ]);
      
      // Format header
      var headerRange = sheet.getRange(1, 1, 1, 19);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f4f6");
    }
    
    // Append the data
    sheet.appendRow([
      data.name,
      data.nisn,
      data.birthPlace,
      data.birthDate,
      data.phone,
      data.address,
      data.school,
      data.fatherName,
      data.motherName,
      data.hasIjazah ? "Ada" : "Tidak Ada",
      data.hasCopyNisn ? "Ada" : "Tidak Ada",
      data.hasRapor ? "Ada" : "Tidak Ada",
      data.hasKK ? "Ada" : "Tidak Ada",
      data.hasAkte ? "Ada" : "Tidak Ada",
      data.hasKtpOrangTua ? "Ada" : "Tidak Ada",
      data.hasKip ? "Ada" : "Tidak Ada",
      data.hasSertifikat ? "Ada" : "Tidak Ada",
      data.hasFoto ? "Ada" : "Tidak Ada",
      new Date().toLocaleString("id-ID")
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "success": true, "message": "Pendaftaran berhasil!" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "success": false, "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var nisn = e.parameter.nisn;
    var major = e.parameter.major;
    
    if (!nisn || !major) {
      return ContentService.createTextOutput(JSON.stringify({ "success": false, "error": "NISN dan Jurusan diperlukan" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(major);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ "success": false, "error": "Data tidak ditemukan untuk jurusan ini" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    var found = null;
    
    // Skip header row
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString() === nisn.toString()) {
        found = {
          name: data[i][0],
          nisn: data[i][1],
          birthPlace: data[i][2],
          birthDate: data[i][3],
          phone: data[i][4],
          address: data[i][5],
          school: data[i][6],
          fatherName: data[i][7],
          motherName: data[i][8],
          major: major,
          hasIjazah: data[i][9] === "Ada",
          hasCopyNisn: data[i][10] === "Ada",
          hasRapor: data[i][11] === "Ada",
          hasKK: data[i][12] === "Ada",
          hasAkte: data[i][13] === "Ada",
          hasKtpOrangTua: data[i][14] === "Ada",
          hasKip: data[i][15] === "Ada",
          hasSertifikat: data[i][16] === "Ada",
          hasFoto: data[i][17] === "Ada"
        };
        break;
      }
    }
    
    if (found) {
      return ContentService.createTextOutput(JSON.stringify({ "success": true, "data": found }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ "success": false, "error": "Data tidak ditemukan. Pastikan NISN dan Jurusan benar." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "success": false, "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle preflight requests (CORS)
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
