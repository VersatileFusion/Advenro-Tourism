const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fs = require('fs');
const path = require('path');
const csv = require('csv-writer');

describe('Export Service Tests', () => {
  let exportService;
  let mockFs;
  let mockPath;
  let mockCsvWriter;

  beforeEach(() => {
    mockFs = {
      writeFileSync: sinon.stub(),
      readFileSync: sinon.stub(),
      existsSync: sinon.stub(),
      mkdirSync: sinon.stub(),
      readdirSync: sinon.stub(),
      unlinkSync: sinon.stub()
    };

    mockPath = {
      join: sinon.stub(),
      resolve: sinon.stub(),
      dirname: sinon.stub()
    };

    mockCsvWriter = {
      createObjectCsvWriter: sinon.stub().returns({
        writeRecords: sinon.stub().resolves()
      })
    };

    // Proxyquire the export service with mocks
    exportService = proxyquire('../../../src/services/export.service', {
      'fs': mockFs,
      'path': mockPath,
      'csv-writer': mockCsvWriter
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV successfully', async () => {
      const data = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' }
      ];
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);

      await exportService.exportToCSV(data, headers, exportPath);

      expect(mockCsvWriter.createObjectCsvWriter.calledOnce).to.be.true;
      expect(mockCsvWriter.createObjectCsvWriter().writeRecords.calledWith(data)).to.be.true;
    });

    it('should create export directory if it does not exist', async () => {
      const data = [{ id: 1, name: 'Test 1' }];
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' }
      ];
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(false);
      mockFs.mkdirSync.returns(undefined);

      await exportService.exportToCSV(data, headers, exportPath);

      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockCsvWriter.createObjectCsvWriter().writeRecords.calledOnce).to.be.true;
    });

    it('should handle export errors', async () => {
      const data = [{ id: 1, name: 'Test 1' }];
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' }
      ];
      const exportPath = '/export/path';
      const error = new Error('Export failed');
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockCsvWriter.createObjectCsvWriter().writeRecords.rejects(error);

      try {
        await exportService.exportToCSV(data, headers, exportPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('exportToJSON', () => {
    it('should export data to JSON successfully', async () => {
      const data = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.writeFileSync.returns(undefined);

      await exportService.exportToJSON(data, exportPath);

      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[1]).to.equal(JSON.stringify(data, null, 2));
    });

    it('should create export directory if it does not exist', async () => {
      const data = [{ id: 1, name: 'Test 1' }];
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(false);
      mockFs.mkdirSync.returns(undefined);
      mockFs.writeFileSync.returns(undefined);

      await exportService.exportToJSON(data, exportPath);

      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
    });

    it('should handle export errors', async () => {
      const data = [{ id: 1, name: 'Test 1' }];
      const exportPath = '/export/path';
      const error = new Error('Export failed');
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.writeFileSync.throws(error);

      try {
        await exportService.exportToJSON(data, exportPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('exportToExcel', () => {
    it('should export data to Excel successfully', async () => {
      const data = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' }
      ];
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.writeFileSync.returns(undefined);

      await exportService.exportToExcel(data, headers, exportPath);

      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      // Add specific Excel format validation here
    });

    it('should handle export errors', async () => {
      const data = [{ id: 1, name: 'Test 1' }];
      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' }
      ];
      const exportPath = '/export/path';
      const error = new Error('Export failed');
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.writeFileSync.throws(error);

      try {
        await exportService.exportToExcel(data, headers, exportPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('listExports', () => {
    it('should list all available exports', async () => {
      const exportFiles = [
        'export-2024-03-27-12-00-00.csv',
        'export-2024-03-26-12-00-00.json'
      ];
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.readdirSync.returns(exportFiles);

      const result = await exportService.listExports();

      expect(result).to.deep.equal(exportFiles);
      expect(mockFs.readdirSync.calledOnce).to.be.true;
    });

    it('should handle non-existent export directory', async () => {
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(false);

      const result = await exportService.listExports();

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should handle directory read errors', async () => {
      const exportPath = '/export/path';
      const error = new Error('Directory read failed');
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.readdirSync.throws(error);

      try {
        await exportService.listExports();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('deleteExport', () => {
    it('should delete an export file successfully', async () => {
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.unlinkSync.returns(undefined);

      await exportService.deleteExport(exportPath);

      expect(mockFs.unlinkSync.calledOnce).to.be.true;
    });

    it('should handle non-existent export file', async () => {
      const exportPath = '/export/path';
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(false);

      try {
        await exportService.deleteExport(exportPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.include('Export file not found');
      }
    });

    it('should handle deletion errors', async () => {
      const exportPath = '/export/path';
      const error = new Error('Deletion failed');
      mockPath.join.returns(exportPath);
      mockFs.existsSync.returns(true);
      mockFs.unlinkSync.throws(error);

      try {
        await exportService.deleteExport(exportPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
}); 