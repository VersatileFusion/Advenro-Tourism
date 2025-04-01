const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'exports');
  }

  async exportToCSV(data, headers, filePath) {
    try {
      const exportPath = path.join(this.exportDir, filePath);
      const dirPath = path.dirname(exportPath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const csvWriter = createObjectCsvWriter({
        path: exportPath,
        header: headers
      });

      await csvWriter.writeRecords(data);
      return exportPath;
    } catch (error) {
      throw error;
    }
  }

  async exportToJSON(data, filePath) {
    try {
      const exportPath = path.join(this.exportDir, filePath);
      const dirPath = path.dirname(exportPath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
      return exportPath;
    } catch (error) {
      throw error;
    }
  }

  async exportToExcel(data, headers, filePath) {
    try {
      const exportPath = path.join(this.exportDir, filePath);
      const dirPath = path.dirname(exportPath);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Convert data to CSV format (simplified Excel export)
      const csvWriter = createObjectCsvWriter({
        path: exportPath,
        header: headers
      });

      await csvWriter.writeRecords(data);
      return exportPath;
    } catch (error) {
      throw error;
    }
  }

  async listExports() {
    try {
      if (!fs.existsSync(this.exportDir)) {
        return [];
      }

      return fs.readdirSync(this.exportDir);
    } catch (error) {
      throw error;
    }
  }

  async deleteExport(filePath) {
    try {
      const exportPath = path.join(this.exportDir, filePath);

      if (!fs.existsSync(exportPath)) {
        throw new Error('Export file not found');
      }

      fs.unlinkSync(exportPath);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ExportService(); 