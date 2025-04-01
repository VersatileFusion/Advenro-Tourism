const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fs = require('fs');
const path = require('path');

describe('Backup Service Tests', () => {
  let backupService;
  let mockFs;
  let mockPath;
  let mockDate;

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

    mockDate = {
      toISOString: sinon.stub().returns('2024-03-27T12:00:00.000Z')
    };

    // Proxyquire the backup service with mocks
    backupService = proxyquire('../../../src/services/backup.service', {
      'fs': mockFs,
      'path': mockPath,
      'date-fns': {
        format: sinon.stub().returns('2024-03-27-12-00-00')
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const data = { test: 'data' };
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.writeFileSync.returns(undefined);

      await backupService.createBackup(data);

      expect(mockFs.writeFileSync.calledOnce).to.be.true;
      expect(mockPath.join.called).to.be.true;
      expect(mockFs.writeFileSync.firstCall.args[1]).to.equal(JSON.stringify(data, null, 2));
    });

    it('should create backup directory if it does not exist', async () => {
      const data = { test: 'data' };
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(false);
      mockFs.mkdirSync.returns(undefined);
      mockFs.writeFileSync.returns(undefined);

      await backupService.createBackup(data);

      expect(mockFs.mkdirSync.calledOnce).to.be.true;
      expect(mockFs.writeFileSync.calledOnce).to.be.true;
    });

    it('should handle backup creation errors', async () => {
      const data = { test: 'data' };
      const error = new Error('Backup failed');
      mockPath.join.returns('/backup/path');
      mockFs.existsSync.returns(true);
      mockFs.writeFileSync.throws(error);

      try {
        await backupService.createBackup(data);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('restoreBackup', () => {
    it('should restore a backup successfully', async () => {
      const backupData = { test: 'data' };
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.readFileSync.returns(JSON.stringify(backupData));

      const result = await backupService.restoreBackup(backupPath);

      expect(result).to.deep.equal(backupData);
      expect(mockFs.readFileSync.calledOnce).to.be.true;
    });

    it('should handle non-existent backup file', async () => {
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(false);

      try {
        await backupService.restoreBackup(backupPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.include('Backup file not found');
      }
    });

    it('should handle invalid backup data', async () => {
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.readFileSync.returns('invalid json');

      try {
        await backupService.restoreBackup(backupPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.include('Invalid backup data');
      }
    });
  });

  describe('listBackups', () => {
    it('should list all available backups', async () => {
      const backupFiles = [
        'backup-2024-03-27-12-00-00.json',
        'backup-2024-03-26-12-00-00.json'
      ];
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.readdirSync.returns(backupFiles);

      const result = await backupService.listBackups();

      expect(result).to.deep.equal(backupFiles);
      expect(mockFs.readdirSync.calledOnce).to.be.true;
    });

    it('should handle non-existent backup directory', async () => {
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(false);

      const result = await backupService.listBackups();

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should handle directory read errors', async () => {
      const backupPath = '/backup/path';
      const error = new Error('Directory read failed');
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.readdirSync.throws(error);

      try {
        await backupService.listBackups();
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup successfully', async () => {
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.unlinkSync.returns(undefined);

      await backupService.deleteBackup(backupPath);

      expect(mockFs.unlinkSync.calledOnce).to.be.true;
    });

    it('should handle non-existent backup file', async () => {
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(false);

      try {
        await backupService.deleteBackup(backupPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err.message).to.include('Backup file not found');
      }
    });

    it('should handle deletion errors', async () => {
      const backupPath = '/backup/path';
      const error = new Error('Deletion failed');
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.unlinkSync.throws(error);

      try {
        await backupService.deleteBackup(backupPath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete backups older than specified days', async () => {
      const backupFiles = [
        'backup-2024-03-27-12-00-00.json',
        'backup-2024-03-20-12-00-00.json',
        'backup-2024-03-15-12-00-00.json'
      ];
      const backupPath = '/backup/path';
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.readdirSync.returns(backupFiles);
      mockFs.unlinkSync.returns(undefined);

      await backupService.cleanupOldBackups(7);

      expect(mockFs.unlinkSync.callCount).to.equal(2);
    });

    it('should handle cleanup errors', async () => {
      const backupFiles = ['backup-2024-03-20-12-00-00.json'];
      const backupPath = '/backup/path';
      const error = new Error('Cleanup failed');
      mockPath.join.returns(backupPath);
      mockFs.existsSync.returns(true);
      mockFs.readdirSync.returns(backupFiles);
      mockFs.unlinkSync.throws(error);

      try {
        await backupService.cleanupOldBackups(7);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
}); 