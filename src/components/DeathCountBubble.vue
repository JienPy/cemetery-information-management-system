<template>
    <Transition name="fade">
      <div class="floating-bubble" v-if="totalDeaths > 0">
        <!-- Notification Badge -->
        <Transition name="bounce">
          <div v-if="hasNewRecords" class="notification-badge" @click="acknowledgeNewRecords">
            +{{ newRecordsCount }}
          </div>
        </Transition>
  
        <!-- Enhanced Tooltip -->
        <Transition name="slide-fade">
          <div class="tooltip-container" v-if="showTooltip" role="tooltip">
            <div class="tooltip-content">
              <div class="tooltip-header">
                <span class="tooltip-icon">📊</span>
                <span class="tooltip-title">Burial Records Statistics</span>
              </div>
              <div class="tooltip-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Records:</span>
                  <span class="stat-value">{{ formattedCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Today's Records:</span>
                  <span class="stat-value">{{ todayRecords }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">This Month:</span>
                  <span class="stat-value">{{ monthlyRecords }}</span>
                </div>
              </div>
              <div class="tooltip-footer">
                Last updated: {{ lastUpdated }}
              </div>
            </div>
            <div class="tooltip-arrow"></div>
          </div>
        </Transition>
        
        <!-- Main Bubble -->
        <button
          class="count-bubble"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
          @click="toggleDetailMode"
          :class="{
            'is-pulsing': isPulsing,
            'is-floating': isFloating,
            'is-detailed': detailMode
          }"
          role="status"
          aria-live="polite"
        >
          <div class="count-content" :class="{ 'rotate-content': isRotating }">
            <template v-if="!detailMode">
              <span class="count-number">{{ formattedCount }}</span>
              <span class="count-label">Total Records</span>
            </template>
            <template v-else>
              <div class="detail-view">
                <span class="detail-icon">🔍</span>
                <span class="detail-number">{{ formattedCount }}</span>
              </div>
            </template>
          </div>
  
          <!-- Particle Effects -->
          <div class="particles" v-if="showParticles">
            <div v-for="n in 8" :key="n" class="particle" :style="particleStyle(n)"></div>
          </div>
        </button>
  
        <!-- Mini Chart -->
        <Transition name="slide">
          <div v-if="detailMode" class="mini-chart">
            <div v-for="(value, index) in chartData" 
                 :key="index" 
                 class="chart-bar"
                 :style="{ height: `${value}%`, animationDelay: `${index * 0.1}s` }">
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import axios from 'axios';
  
  const totalDeaths = ref(0);
  const showTooltip = ref(false);
  const isPulsing = ref(false);
  const isFloating = ref(true);
  const isRotating = ref(false);
  const detailMode = ref(false);
  const showParticles = ref(false);
  const hasNewRecords = ref(false);
  const newRecordsCount = ref(0);
  const todayRecords = ref(0);
  const monthlyRecords = ref(0);
  const lastUpdated = ref('');
  const chartData = ref([30, 45, 60, 75, 55, 65, 70]); // Example data
  
  // Floating animation interval
  let floatingInterval;
  
  const formattedCount = computed(() => {
    return new Intl.NumberFormat().format(totalDeaths.value);
  });
  
  const particleStyle = (n) => {
    const angle = (n / 8) * 2 * Math.PI;
    return {
      '--angle': `${angle}rad`,
      '--delay': `${n * 0.1}s`
    };
  };
  
  const handleMouseEnter = () => {
    showTooltip.value = true;
    isFloating.value = false;
  };
  
  const handleMouseLeave = () => {
    showTooltip.value = false;
    isFloating.value = true;
  };
  
  const toggleDetailMode = () => {
    detailMode.value = !detailMode.value;
    isRotating.value = true;
    showParticles.value = true;
    
    setTimeout(() => {
      isRotating.value = false;
      showParticles.value = false;
    }, 1000);
  };
  
  const acknowledgeNewRecords = () => {
    hasNewRecords.value = false;
    newRecordsCount.value = 0;
  };
  
  const startFloatingAnimation = () => {
    floatingInterval = setInterval(() => {
      isFloating.value = true;
    }, 3000);
  };
  
  const fetchTotalDeaths = async () => {
    try {
      const authToken = localStorage.getItem('auth-token');
      const response = await axios.get('http://localhost:8055/items/burial_records', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const records = response.data.data;
      const newTotal = response.data.data.length;

      // Calculate today's records
    const today = new Date();
    const todayRecordCount = records.filter(record => {
      const recordDate = new Date(record.date_created);
      return recordDate.toDateString() === today.toDateString();
    }).length;
    
    // Calculate this month's records
    const monthRecordCount = records.filter(record => {
      const recordDate = new Date(record.date_created);
      return recordDate.getMonth() === today.getMonth() && 
             recordDate.getFullYear() === today.getFullYear();
    }).length;
      
      if (newTotal > totalDeaths.value && totalDeaths.value !== 0) {
        hasNewRecords.value = true;
        newRecordsCount.value = newTotal - totalDeaths.value;
        showParticles.value = true;
        setTimeout(() => showParticles.value = false, 2000);
      }
      
      totalDeaths.value = newTotal;
    todayRecords.value = todayRecordCount;
    monthlyRecords.value = monthRecordCount;
    lastUpdated.value = new Date().toLocaleString();
      
      isPulsing.value = true;
      setTimeout(() => {
        isPulsing.value = false;
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch burial records:', error);
    }
  };
  
  // Poll for updates every 30 seconds
  const startPolling = () => {
    setInterval(fetchTotalDeaths, 30000);
  };
  
  onMounted(() => {
    fetchTotalDeaths();
    startPolling();
    startFloatingAnimation();
  });
  
  onUnmounted(() => {
    clearInterval(floatingInterval);
  });
  </script>
  
  <style scoped>
  .floating-bubble {
    position: fixed;
    right: 24px;
    top: 120px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 1000;
  }
  
  .count-bubble {
    background: linear-gradient(145deg, #2c5282, #2b6cb0);
    border: none;
    border-radius: 16px;
    padding: 16px 20px;
    min-width: 100px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
  }
  
  .count-bubble::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }
  
  .count-bubble:hover::before {
    transform: translateX(100%);
  }
  
  .count-bubble:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2),
                0 4px 6px -2px rgba(0, 0, 0, 0.1);
  }
  
  .count-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .count-number {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  background: linear-gradient(to right, #ffffff, #e2e8f0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
  
  .count-label {
    font-size: 0.875rem;
    opacity: 0.9;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  /* Notification Badge */
  .notification-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #e53e3e;
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  /* Enhanced Tooltip */
  .tooltip-container {
    position: absolute;
    right: calc(100% + 20px);
    background: rgba(26, 32, 44, 0.95);
    backdrop-filter: blur(4px);
    color: white;
    padding: 16px;
    border-radius: 12px;
    font-size: 0.875rem;
    width: max-content;
    max-width: 320px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .tooltip-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tooltip-title {
    font-weight: 600;
    font-size: 1rem;
  }
  
  .tooltip-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat-label {
    opacity: 0.8;
  }
  
  .stat-value {
    font-weight: 600;
  }
  
  .tooltip-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.75rem;
    opacity: 0.6;
  }
  
  /* Mini Chart */
  .mini-chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 40px;
    margin-left: 16px;
  }
  
  .chart-bar {
    width: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 2px;
    transform-origin: bottom;
    animation: barRise 0.5s ease-out forwards;
  }
  
  /* Particles */
  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
  }
  
  .particle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: particleExplode 1s ease-out forwards;
    animation-delay: var(--delay);
  }
  
  /* Animations */
  @keyframes particleExplode {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) translateX(calc(cos(var(--angle)) * 50px)) 
                 translateY(calc(sin(var(--angle)) * 50px)) scale(1);
      opacity: 0;
    }
  }
  
  @keyframes barRise {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
  
  .rotate-content {
    transform: rotateY(180deg);
  }
  
  .is-floating {
    animation: float 3s ease-in-out infinite;
  }
  
  .is-pulsing {
    animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1);
  }
  
  .is-detailed {
    width: auto;
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
    }
  }
  
  /* Transition Animations */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  
  .bounce-enter-active {
    animation: bounce-in 0.5s;
  }
  
  .bounce-leave-active {
    animation: bounce-in 0.5s reverse;
  }
  
  @keyframes bounce-in {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.25);
    }
    100% {
      transform: scale(1);
    }
  }

  .slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

/* Detail View Styles */
.detail-view {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
}

.detail-icon {
  font-size: 1.25rem;
  animation: spin-pulse 2s infinite linear;
}

.detail-number {
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(120deg, #ffffff, #a8b2d1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Hover Effects */
.count-bubble:hover .detail-icon {
  animation: wiggle 0.5s ease-in-out;
}

/* Glass Morphism Effect */
.count-bubble.is-detailed {
  background: linear-gradient(
    135deg,
    rgba(44, 82, 130, 0.9),
    rgba(43, 108, 176, 0.8)
  );
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Enhanced Particle System */
.particle-system {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  animation: sparkle-float 1.5s ease-in-out infinite;
}

/* Progress Ring */
.progress-ring {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 40px;
  height: 40px;
  transform: rotate(-90deg);
}

.progress-ring-circle {
  stroke: #4299e1;
  stroke-width: 3;
  fill: transparent;
  stroke-dasharray: 100;
  transition: stroke-dashoffset 0.5s ease;
}

/* New Loading State */
.is-loading {
  position: relative;
  overflow: hidden;
}

.is-loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: loading-shine 1.5s infinite;
}

/* New Animations */
@keyframes spin-pulse {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}

@keyframes sparkle-float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) scale(1.5);
    opacity: 0.8;
  }
}

@keyframes loading-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .floating-bubble {
    right: 16px;
    top: 60px;
  }

  .count-bubble {
    padding: 12px 16px;
    min-width: 80px;
  }

  .count-number {
    font-size: 1.5rem;
  }

  .tooltip-container {
    right: 0;
    top: calc(100% + 20px);
    width: 280px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .count-bubble {
    background: linear-gradient(145deg, #1a365d, #2c5282);
  }

  .tooltip-container {
    background: rgba(17, 25, 40, 0.95);
  }
}

/* Accessibility Improvements */
.count-bubble:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
}

.count-bubble:focus:not(:focus-visible) {
  box-shadow: none;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .is-floating,
  .particle,
  .sparkle,
  .detail-icon,
  .chart-bar {
    animation: none;
  }

  .count-bubble:hover {
    transform: none;
  }
}

/* Interactive States */
.count-bubble:active {
  transform: scale(0.95);
}

.is-error {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
  </style>