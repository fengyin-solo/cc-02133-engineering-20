<template>
  <div class="case-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <h1 class="page-title">案例展示</h1>
        <p class="page-subtitle">众多企业的信赖之选，见证智慧物流的力量</p>
      </div>
    </section>
    
    <!-- 筛选标签 -->
    <section class="filter-section">
      <div class="container">
        <div class="filter-tags">
          <el-button 
            v-for="tag in tags" 
            :key="tag.value"
            :type="activeTag === tag.value ? 'primary' : ''"
            round
            @click="activeTag = tag.value"
          >
            {{ tag.label }}
          </el-button>
        </div>
      </div>
    </section>
    
    <!-- 案例列表 -->
    <section class="section section-gray">
      <div class="container">
        <div class="case-grid">
          <div 
            class="case-detail-card" 
            v-for="caseItem in filteredCases" 
            :key="caseItem.title"
          >
            <div class="case-header" :style="{ background: caseItem.gradient }">
              <div class="case-logo">
                <el-icon :size="48"><OfficeBuilding /></el-icon>
              </div>
              <div class="case-tag">{{ caseItem.industry }}</div>
            </div>
            <div class="case-body">
              <h3 class="case-title">{{ caseItem.title }}</h3>
              <p class="case-desc">{{ caseItem.description }}</p>
              
              <div class="case-challenge">
                <h4><el-icon><Warning /></el-icon> 面临挑战</h4>
                <p>{{ caseItem.challenge }}</p>
              </div>
              
              <div class="case-solution">
                <h4><el-icon><Checked /></el-icon> 解决方案</h4>
                <p>{{ caseItem.solution }}</p>
              </div>
              
              <div class="case-results">
                <h4>实施效果</h4>
                <div class="result-items">
                  <div class="result-item" v-for="result in caseItem.results" :key="result.label">
                    <span class="result-value">{{ result.value }}</span>
                    <span class="result-label">{{ result.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 客户评价 -->
    <section class="section section-light">
      <div class="container">
        <SectionTitle 
          title="客户评价" 
          subtitle="听听他们怎么说"
        />
        <div class="testimonial-grid">
          <div class="testimonial-card" v-for="testimonial in testimonials" :key="testimonial.name">
            <div class="quote-icon">
              <el-icon :size="32"><ChatDotSquare /></el-icon>
            </div>
            <p class="testimonial-content">{{ testimonial.content }}</p>
            <div class="testimonial-author">
              <div class="author-avatar">
                <el-icon :size="24"><User /></el-icon>
              </div>
              <div class="author-info">
                <h4>{{ testimonial.name }}</h4>
                <p>{{ testimonial.title }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- CTA -->
    <section class="section cta-section">
      <div class="container text-center">
        <h2 class="cta-title">想成为下一个成功案例？</h2>
        <p class="cta-desc">联系我们，开启您的智慧物流之旅</p>
        <el-button type="primary" size="large" round @click="$router.push('/contact')">
          立即咨询
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SectionTitle from '@/components/SectionTitle.vue'
import cases from '@/data/cases'

const activeTag = ref('all')

const tags = [
  { label: '全部案例', value: 'all' },
  { label: '电商物流', value: 'ecommerce' },
  { label: '快递物流', value: 'express' },
  { label: '零售配送', value: 'retail' },
  { label: '制造业', value: 'manufacturing' }
]

const filteredCases = computed(() => {
  if (activeTag.value === 'all') {
    return cases
  }
  return cases.filter(c => c.tag === activeTag.value)
})

const testimonials = [
  {
    content: '知运的智慧仓储系统帮助我们实现了仓库作业的全面升级，效率提升非常明显，团队都很满意。',
    name: '王经理',
    title: '某电商平台物流总监'
  },
  {
    content: '运输管理系统的智能调度功能非常强大，帮我们节省了大量的运输成本，ROI超出预期。',
    name: '李总',
    title: '某快递企业运营副总'
  },
  {
    content: '配送系统上线后，门店配送准时率大幅提升，客户满意度明显提高，非常感谢知运团队。',
    name: '张总监',
    title: '某零售集团供应链总监'
  }
]
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.page-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: $spacing-xxl 0;
  text-align: center;
  color: #fff;
}

.page-title {
  font-size: $font-size-xxxl;
  font-weight: 700;
  margin-bottom: $spacing-sm;
}

.page-subtitle {
  font-size: $font-size-lg;
  opacity: 0.75;
}

.filter-section {
  background: $bg-white;
  padding: $spacing-lg 0;
  border-bottom: 1px solid $border-light;
}

.filter-tags {
  display: flex;
  gap: $spacing-sm;
  flex-wrap: wrap;
  justify-content: center;
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xl;
}

.case-detail-card {
  background: $bg-white;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: $shadow-lg;
  }
}

.case-header {
  height: 160px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.case-logo {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.case-tag {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  background: rgba(255, 255, 255, 0.9);
  color: $text-primary;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: 500;
}

.case-body {
  padding: $spacing-lg;
}

.case-title {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.case-desc {
  font-size: $font-size-sm;
  color: $text-secondary;
  margin-bottom: $spacing-md;
}

.case-challenge,
.case-solution {
  margin-bottom: $spacing-md;
  
  h4 {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;
    color: $text-primary;
    margin-bottom: $spacing-xs;
    
    .el-icon {
      color: $warning-color;
    }
  }
  
  p {
    font-size: $font-size-sm;
    color: $text-secondary;
    padding-left: 24px;
  }
}

.case-solution h4 .el-icon {
  color: $success-color;
}

.case-results {
  background: $bg-color;
  margin: 0 (-$spacing-lg) (-$spacing-lg);
  padding: $spacing-md $spacing-lg;
  
  h4 {
    font-size: $font-size-sm;
    color: $text-primary;
    margin-bottom: $spacing-sm;
  }
}

.result-items {
  display: flex;
  gap: $spacing-lg;
}

.result-item {
  text-align: center;
  
  .result-value {
    display: block;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $primary-color;
  }
  
  .result-label {
    font-size: $font-size-xs;
    color: $text-secondary;
  }
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;
}

.testimonial-card {
  background: $bg-white;
  padding: $spacing-xl;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
  position: relative;
}

.quote-icon {
  color: rgba($primary-color, 0.2);
  margin-bottom: $spacing-md;
}

.testimonial-content {
  font-size: $font-size-base;
  color: $text-regular;
  line-height: $line-height-loose;
  margin-bottom: $spacing-lg;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.author-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, $primary-color, $primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.author-info {
  h4 {
    font-size: $font-size-base;
    color: $text-primary;
  }
  
  p {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.cta-section {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  color: #fff;
}

.cta-title {
  font-size: $font-size-xxl;
  font-weight: 700;
  margin-bottom: $spacing-md;
}

.cta-desc {
  font-size: $font-size-lg;
  opacity: 0.85;
  margin-bottom: $spacing-xl;
}

@media (max-width: $breakpoint-lg) {
  .case-grid {
    grid-template-columns: 1fr;
  }
  
  .testimonial-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .page-title {
    font-size: $font-size-xxl;
  }
  
  .result-items {
    flex-wrap: wrap;
  }
}
</style>
