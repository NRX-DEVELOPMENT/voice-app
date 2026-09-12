const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const activeUsers = {}; 
const channels = {
    'general': { name: '🔊 General', custom: false },
    'private': { name: '🔊 Private', custom: false }
};

io.on('connection', socket => {
    socket.emit('channel-list', channels);

    socket.on('join-room', (roomId, peerId, username, avatar) => {
        socket.join(roomId);
        activeUsers[socket.id] = { username, avatar, roomId, peerId };

        socket.to(roomId).emit('user-connected', peerId);
        updateUserList(roomId);

        socket.on('disconnect', () => {
            const user = activeUsers[socket.id];
            if (user) {
                socket.to(user.roomId).emit('user-disconnected', user.peerId);
                delete activeUsers[socket.id];
                updateUserList(user.roomId);
            }
        });
    });

    socket.on('create-channel', (channelName, username) => {
        if (username !== 'Younis') return; 
        const channelId = channelName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        if (!channels[channelId]) {
            channels[channelId] = { name: `🔊 ${channelName}`, custom: true };
            io.emit('channel-list', channels);
        }
    });

    socket.on('delete-channel', (channelId, username) => {
        if (username !== 'Younis') return;
        if (channels[channelId] && channels[channelId].custom) {
            delete channels[channelId];
            io.emit('channel-list', channels);
        }
    });

    function updateUserList(roomId) {
        const usersInRoom = Object.values(activeUsers).filter(u => u.roomId === roomId);
        io.to(roomId).emit('room-users', usersInRoom);
    }
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, "0.0.0.0", () => {
    console.log(`Voice-Chat Server running on port ${PORT}`);
});
