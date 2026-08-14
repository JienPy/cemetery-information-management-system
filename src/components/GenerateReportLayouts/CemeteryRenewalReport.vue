<template>
  <v-dialog v-model="dialog" persistent max-width="900px">
    <v-card>
      <v-card-title class="text-h5 d-flex justify-space-between align-center">
        <span>Cemetery Plot Renewal Notification</span>
        <v-btn 
          color="success" 
          prepend-icon="mdi-download" 
          @click="downloadDocument"
          variant="flat"
        >
          Download Document
        </v-btn>
        <v-btn 
          color="error" 
          icon 
          @click="closeDialog"
          variant="text"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <div class="preview-container bg-white">
          <div class="text-center mb-8">
            <v-img
              src="/OCP_logo.png"  
              class="mx-auto mb-4"
              max-width="100"
              contain
            />
            <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-2">
              OFFICE OF CEMETERY PUBLIC OPERATION
            </h3>
            <p class="text-subtitle-1 text-grey-darken-1">
              Municipality of {{ formData.municipality || '[Municipality Name]' }}
            </p>
            <p class="text-subtitle-1 text-grey-darken-1">
              Province of {{ formData.province || '[Province Name]' }}
            </p>
            <p class="text-subtitle-2 text-grey-darken-1">
              Date: {{ getCurrentDate() }}
            </p>
          </div>

          <div class="mb-8">
            <p>
              Barangay <strong>{{ formData.address || '[Barangay]' }}</strong>. 
            </p>
            <h3 class="text-h9 font-weight-bold text-justify text-grey-darken-3">
              Subject: Notification for Renewal of Cemetery Plot for the Late <strong>{{ getFullName() }}</strong>
            </h3>
          </div>

          <div class="text-body-1 text-grey-darken-3">
            <p>Dear Family of the Late <strong>{{ getFullName() }}</strong>,</p>

            <p class="mt-4 text-justify">
              We are reaching out to inform you of the upcoming expiration of the cemetery
              plot for your dearly departed. The burial plot currently occupied by 
              <strong>{{ getFullName() }}</strong> will expire on 
              <strong>{{ formatDisplayDate(expirationDate) || '[Expiration Date]' }}</strong>.
            </p>

            <p class="mt-4 text-justify">
              As per our records, the initial plot lease will reach its term limit 
              on the specified date. To maintain the plot and continue honoring the memory of 
              your loved one in its current location, a renewal will be required. We kindly 
              request that you contact the Office of the Cemetery Public Office at your earliest 
              convenience to initiate the renewal process.
            </p>

            <p class="mt-4 text-justify">
              Please coordinate with us no later than 
              <strong>{{ formatDisplayDate(renewalDeadline) || '[Final Deadline Of Renewal]' }}</strong> 
              to avoid any inconvenience. For further information regarding the renewal process, 
              fees, and any required documentation, feel free to contact our office directly at 
              <strong>{{ formData.contactNumber || '[Contact Number]' }}</strong> or via email at 
              <strong>{{ formData.emailAddress || '[Email Address]' }}</strong>.
            </p>

            <p class="mt-4 text-justify">
              We understand that this is a sensitive matter, and we appreciate your attention to 
              this notice to ensure the peaceful preservation of 
              <strong>{{ getFullName() }}</strong>'s resting place.
            </p>

            <p class="mt-8">
              We appreciate your cooperation and support in this matter.
            </p>

            <div class="mt-16 text-center">
              <div class="border-t-2 border-grey-darken-2 d-inline-block" style="width: 200px">
              </div>
              <p>______________________</p>
              <p class="mt-2 font-weight-medium">Cemetery Management Officer</p>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
  
  <script setup>
  import { ref, defineProps, defineEmits, computed } from 'vue'
  import { Document, Paragraph, TextRun, ImageRun, AlignmentType, Packer } from 'docx'
  
  const props = defineProps({
    recordData: {
      type: Object,
      required: true
    }
  })
  
  const emit = defineEmits(['close'])
  
  const dialog = ref(true)

  // Calculate years of coverage based on initial 7-year term and renewals
const calculateExpirationDate = (dateOfDeath, numberOfRenewals) => {
  if (!dateOfDeath) return null

  const baseYearCovered = 7
  const renewalYears = numberOfRenewals ? parseInt(numberOfRenewals, 10) || 0 : 0
  const totalYearsCovered = baseYearCovered + (renewalYears * 7)

  const deathDate = new Date(props.recordData.date_of_death)
  const expirationDate = new Date(deathDate)
  expirationDate.setFullYear(deathDate.getFullYear() + totalYearsCovered)

  return expirationDate
}

// Computed expiration and renewal deadline dates
const expirationDate = computed(() => 
  calculateExpirationDate(props.recordData.date_of_death, props.recordData.number_of_renew)
)

const renewalDeadline = computed(() => {
  if (!expirationDate.value) return null
  const deadline = new Date(expirationDate.value)
  deadline.setDate(deadline.getDate() - 30) // 30 days before expiration
  return deadline
})

const formData = ref({
  firstName: props.recordData.first_name,
  middleName: props.recordData.middle_name,
  lastName: props.recordData.last_name,
  municipality: props.recordData.municipality || 'Tayabas City',
  province: props.recordData.province || 'Quezon Province',
  address: props.recordData.address,
  contactNumber: props.recordData.contact_number || '+63 945-898-7845',
  emailAddress: props.recordData.email_address || 'opco-cemetery@admin.com'
})

const getFullName = () => {
  return [formData.value.firstName, formData.value.middleName, formData.value.lastName]
    .filter(Boolean)
    .join(' ')
}

const getCurrentDate = () => {
  return new Date().toLocaleDateString()
}

const formatDisplayDate = (date) => {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: '2-digit'
  })
}

const getBase64Image = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      resolve(dataURL.split(',')[1])
    }
    img.onerror = (error) => reject(error)
  })
}

const downloadDocument = async () => {
if (!formData.value.firstName) {
  console.error('Name is required to generate the document.')
  return
}

try {
  const logoBase64 = await getBase64Image('/OCP_logo.png')
  const doc = new Document({
    sections: [{
      properties: {
        size: {
          width: 12240,
          height: 15840,
        },
      },
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: logoBase64,
              transformation: {
                width: 100,
                height: 100,
              },
            }),
            new TextRun({
              text: "OFFICE OF CEMETERY PUBLIC OPERATION",
              bold: true,
              size: 32,
              break: 1,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 10 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Municipality of ${formData.value.municipality}`,
              size: 24,
              break: 1,
            }),
            new TextRun({
              text: `Province of ${formData.value.province}`,
              size: 24,
              break: 1,
            }),
            new TextRun({
              text: `Date: ${getCurrentDate()}`,
              size: 24,
              break: 1,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Barangay ${formData.value.address}`,
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Subject: Notification for Renewal of Cemetery Plot for the Late ${getFullName()}`,
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Dear Family of the Late ${getFullName()},`,
              size: 24,
            }),
          ],
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `We are reaching out to inform you of the upcoming expiration of the cemetery plot for your dearly departed. The burial plot currently occupied by ${getFullName()} will expire on ${expirationDate.value.toLocaleDateString()}.`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "As per our records, the initial plot lease will reach its term limit on the specified date. To maintain the plot and continue honoring the memory of your loved one in its current location, a renewal will be required. We kindly request that you contact the Office of the Cemetery Public Office at your earliest convenience to initiate the renewal process.",
              size: 24,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Please coordinate with us no later than ${renewalDeadline.value.toLocaleDateString()} to avoid any inconvenience. For further information regarding the renewal process, fees, and any required documentation, feel free to contact our office directly at ${formData.value.contactNumber} or via email at ${formData.value.emailAddress}.`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `We understand that this is a sensitive matter, and we appreciate your attention to this notice to ensure the peaceful preservation of ${getFullName()}'s resting place.`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "We appreciate your cooperation and support in this matter.",
              size: 24,
            }),
          ],
          spacing: { after: 480 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "________________________________",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Cemetery Management Officer",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
      ],
    }],
  })

  Packer.toBlob(doc).then((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cemetery_Plot_Renewal_${getFullName().replace(/\s+/g, '_')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    })
  } catch (error) {
    console.error('Error generating document:', error)
  }
};
const closeDialog = () => {
dialog.value = false
emit('close')
}
</script>

<style scoped>
.preview-container {
  width: 8.5in;
  min-height: 11in;
  padding: 1in;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  font-family: 'Times New Roman', Times, serif;
  line-height: 1.6;
  margin: 16px;
}
</style>