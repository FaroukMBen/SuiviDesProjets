const request = require('supertest');
const app = require('../src/index');
const Campaign = require('../src/models/Campagne');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Mock Campaign Model
jest.mock('../src/models/Campagne');

describe('Group Fetching API', () => {

    let token;

    beforeAll(() => {
        token = jwt.sign(
            { id: 'admin_id', role: 'admin' },
            process.env.JWT_SECRET || 'test_secret',
            { expiresIn: '1h' }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch unique groups for a given year', async () => {
        // Mock data
        const mockCampaigns = [
            { targetGroups: ['TP-A', 'TP-B'] },
            { targetGroups: ['TP-B', 'TP-C'] }
        ];

        // Mock Campaign.find chain
        const mockSelect = jest.fn().mockResolvedValue(mockCampaigns);
        Campaign.find.mockReturnValue({ select: mockSelect });

        const res = await request(app)
            .get('/api/campaigns/groups/BUT1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.groups).toEqual(['TP-A', 'TP-B', 'TP-C']);
        expect(Campaign.find).toHaveBeenCalledWith({ targetYear: 'BUT1' });
    });

    it('should return empty list if no campaigns found', async () => {
        const mockSelect = jest.fn().mockResolvedValue([]);
        Campaign.find.mockReturnValue({ select: mockSelect });

        const res = await request(app)
            .get('/api/campaigns/groups/BUT1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.groups).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
        const mockSelect = jest.fn().mockRejectedValue(new Error('Database error'));
        Campaign.find.mockReturnValue({ select: mockSelect });

        const res = await request(app)
            .get('/api/campaigns/groups/BUT1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(500);
    });
});
