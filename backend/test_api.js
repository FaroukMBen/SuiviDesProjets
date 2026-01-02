const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testNotificationFlow() {
    try {
        console.log('1. Registering User A...');
        const userA = {
            name: 'User A',
            email: `userA_${Date.now()}@test.com`,
            password: 'password123'
        };
        const resA = await axios.post(`${API_URL}/auth/register`, userA);
        const tokenA = resA.data.token;
        const idA = resA.data.user.id; // Corrected from resA.data.user._id if relying on previous auth response structure, let's assume standard
        console.log('User A registered:', idA);

        console.log('2. Registering User B...');
        const userB = {
            name: 'User B',
            email: `userB_${Date.now()}@test.com`,
            password: 'password123'
        };
        const resB = await axios.post(`${API_URL}/auth/register`, userB);
        const tokenB = resB.data.token;
        const idB = resB.data.user.id;
        console.log('User B registered:', idB);

        console.log('3. Creating Project by User A...');
        const project = {
            title: 'Test Project',
            description: 'A test project',
            deadline: new Date()
        };
        const resProject = await axios.post(`${API_URL}/projects`, project, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        const projectId = resProject.data.project._id;
        console.log('Project created:', projectId);

        console.log('4. User A invites User B...');
        try {
            const resInvite = await axios.post(`${API_URL}/notifications/invite`, {
                recipientId: idB,
                projectId: projectId
            }, {
                headers: { Authorization: `Bearer ${tokenA}` }
            });
            console.log('Invitation sent:', resInvite.data);
        } catch (e) {
            console.error('Invitation failed:', e.response ? e.response.data : e.message);
            return;
        }

        console.log('5. User B checks notifications...');
        const resNotifs = await axios.get(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        const notifications = resNotifs.data;
        console.log('User B notifications:', notifications.length);

        if (notifications.length === 0) {
            console.error('FAIL: No notifications found for User B');
            return;
        }

        const inviteNotif = notifications.find(n => n.type === 'INVITATION');
        if (!inviteNotif) {
            console.error('FAIL: Invitation notification not found');
            return;
        }
        console.log('Invitation notification found:', inviteNotif._id);

        console.log('6. User B accepts invitation...');
        const resAccept = await axios.post(`${API_URL}/notifications/${inviteNotif._id}/respond`, {
            action: 'accept'
        }, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        console.log('Invitation accepted:', resAccept.data);

        // Verify project member
        console.log('7. Verifying Project Members...');
        const resProjectCheck = await axios.get(`${API_URL}/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        const members = resProjectCheck.data.project.members;
        const isMember = members.some(m => m._id === idB);

        if (isMember) {
            console.log('SUCCESS: User B is now a member of the project!');
        } else {
            console.error('FAIL: User B is NOT in the project members list');
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testNotificationFlow();
