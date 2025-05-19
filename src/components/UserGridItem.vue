<template>
    <div class="user-grid-item">
        <div class="user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z" />
                <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    fill="currentColor" />
            </svg>
        </div>
        <div class="user-info">
            <h3>{{ userData.name }}</h3>
            <p>{{ userData.description }}</p>
        </div>
    </div>
</template>

<script setup>
defineProps({
    userData: {
        type: Object,
        default: () => ({
            name: 'Usuario',
            description: 'Información del usuario'
        })
    }
});
</script>

<style scoped>
.user-grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    text-align: center;
    color: #000;
}

.user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
}

.user-avatar svg {
    width: 60%;
    height: 60%;
    color: #555;
}

.user-info h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
}

.user-info p {
    margin: 5px 0 0;
    font-size: 0.9rem;
    color: #666;
}
</style>