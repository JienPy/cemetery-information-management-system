<template>
    <v-row>
          
          <v-col cols="12" md="5">
            <v-card class="elevation-3 rounded-lg">
              <v-card-title class="text-h5 font-weight-bold px-6 pt-6 pb-4">
                <v-icon icon="mdi-file-document-outline" class="mr-2" />
                Generate Renewal Notification
              </v-card-title>
              
              <v-card-text>
                <v-form @submit.prevent="generateReport" class="px-3">
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="formData.municipality"
                        label="Municipality Name"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="formData.province"
                        label="Province Name"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-autocomplete
                        v-model="formData.name"
                        :items="deceasedNames"
                        label="Deceased Person's Full Name"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                        @change="onNameSelected"
                        item-text="fullName"
                        item-value="fullName"
                      />
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="formData.contactNumber"
                        label="Office Contact Number"
                        type="number"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="formData.emailAddress"
                        label=" Our Email Address"
                        type="email"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="formData.address"
                        :items="address"
                        label="Barangay Location"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-text-field
                        v-model="formData.expirationDate"
                        label="Expiration Date"
                        type="date"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12">
                      <v-text-field
                        v-model="formData.deadlineOfRenewal"
                        label="Deadline of Renewal"
                        type="date"
                        variant="outlined"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                        hide-details="auto"
                      />
                    </v-col>

                    <v-col cols="12" class="d-flex gap-4">
                      <v-btn
                        color="primary"
                        size="large"
                        block
                        type="submit"
                        prepend-icon="mdi-file-document-outline"
                      >
                        Generate Notification
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-card-text>
            </v-card>
          </v-col>

          
           <v-col cols="12" md="7">
            <v-card class="elevation-3 rounded-lg">
              <v-card-title class="d-flex justify-space-between align-center px-6 pt-6 pb-4">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-file-eye-outline" class="mr-2" />
                  <span class="text-h5 font-weight-bold">Document Preview</span>
                </div>
                <v-btn
                  color="success"
                  prepend-icon="mdi-download"
                  @click="downloadDocument"
                  variant="flat"
                >
                  Download
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
                      Subject: Notification for Renewal of Cemetery Plot for the Late <strong>{{ formData.name || '[Deceased\'s Full Name]' }}</strong>
                    </h3>
                  </div>

                  <div class="text-body-1 text-grey-darken-3">
                    <p>Dear Family of the Late <strong>{{ formData.name || '[Deceased\'s Full Name]' }}</strong>,</p>

                    <p class="mt-4 text-justify">
                      We are reaching out to inform you of the upcoming expiration of the cemetery
                      plot for your dearly departed. The burial plot currently occupied by 
                      <strong>{{ formData.name || '[Deceased\'s Full Name]' }}</strong> will expire on 
                      <strong>{{ formatDisplayDate(formData.expirationDate) || '[Expiration Date]' }}</strong>.
                    </p>

                    <p class="mt-4 text-justify">As per our records, the initial plot lease will reach its term limit 
                      on the specified date. To maintain the plot and continue honoring the memory of 
                      your loved one in its current location, a renewal will be required. We kindly 
                      request that you contact the Office of the Cemetery Public Office at your earliest 
                      convenience to initiate the renewal process.
                    </p>

                    <p class="mt-4 text-justify">
                      Please coordinate with us no later than 
                      <strong>{{ formData.deadlineOfRenewal || '[Final Deadline Of Renewal]' }}</strong> 
                      to avoid any inconvenience. For further information regarding the renewal process, 
                      fees, and any required documentation, feel free to contact our office directly at 
                      <strong>{{ formData.contactNumber || '[Contact Number]' }}</strong> or via email at 
                      <strong>{{ formData.emailAddress || '[Email Address]' }}</strong>.
                    </p>

                    <p class="mt-4 text-justify">
                      We understand that this is a sensitive matter, and we appreciate your attention to 
                      this notice to ensure the peaceful preservation of 
                      <strong>{{ formData.name || '[Deceased\'s Full Name]' }}</strong>'s resting place.
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
          </v-col>
        </v-row>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { Document, Paragraph, TextRun, ImageRun, Packer, AlignmentType } from 'docx'
const formData = ref({
  municipality: 'TAYABAS',
  province: 'QUEZON',
  contactNumber: '09632532951',
  address: '',
  expirationDate: '',
  emailAddress: 'opco-cemetery@gmail.com',
  deadlineOfRenewal: ''
})

// Define the address array for v-select
const address = ref([
  'Alitao',
  'Angeles',
  'Alupay',
  'Ayaas',
  'Baguio',
  'Banilad',
  'Bukal East',
  'Bukal West',
  'Calumpang',
  'Catnipa',
  'Dapdap',
  'Domoit East',
  'Domoit Proper',
  'Gibanga',
  'Hugom',
  'Ibabang Palale',
  'Ibabang Tayabas',
  'Ilasan',
  'Ipilan',
  'Isabang',
  'Katigan',
  'Lakawan',
  'Lalo',
  'Lawigue',
  'Lita',
  'Malaoa',
  'Mate',
  'Mayao Castillo',
  'Mayao Crossing',
  'Mayao Oro',
  'Mayao Parada',
  'Mayao Silangan',
  'Opias',
  'Pandakaki',
  'Palale Proper',
  'Pook',
  'Potol',
  'San Diego',
  'San Isidro',
  'San Roque',
  'Silangang Malicboy',
  'Tamlong',
  'Tongko',
  'Villeta',
  'Wakas'
])

const deceasedNames = ref([])
const apiUrl = 'http://localhost:8055'
const burialRecordsEndpoint = `${apiUrl}/items/burial_records`

const fetchDeceasedNames = async () => {
  try {
    const response = await axios.get(burialRecordsEndpoint);
    deceasedNames.value = response.data.data.map(record => ({
      fullName: `${record.first_name} ${record.middle_name ? record.middle_name + ' ' : ''}${record.last_name}`.trim(),
      value: `${record.first_name} ${record.middle_name ? record.middle_name + ' ' : ''}${record.last_name}`.trim(),
      title: `${record.first_name} ${record.middle_name ? record.middle_name + ' ' : ''}${record.last_name}`.trim(),
      address: record.address
    }));
  } catch (error) {
    console.error('Error fetching deceased names:', error);
  }
}

const onNameSelected = (selectedName) => {
  formData.value.name = selectedName;
  // Find the selected record and set the address
  const selectedRecord = deceasedNames.value.find(record => record.fullName === selectedName);
  if (selectedRecord) {
    formData.value.address = selectedRecord.address;
  }
}
onMounted(() => {
  fetchDeceasedNames()
})

const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDisplayDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const generateReport = () => {
  const requiredFields = [
    'municipality',
    'province',
    'name',
    'contactNumber',
    'address',
    'expirationDate',
    'deadlineOfRenewal'
  ]
  
  const missingFields = requiredFields.filter(field => !formData.value[field])
  
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields)
    return
  }
  
  console.log('Generating report with data:', formData.value)
}

const downloadDocument = async () => {
  if (!formData.value.name) {
    console.error('Name is required to generate the document.')
    return
  }
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
              text: "OFFICE OF CEMETERY PUBLIC OFFICE",
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
              text: `Subject: Notification for Renewal of Cemetery Plot for the Late ${formData.value.name}`,
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
              text: `Dear Family of the Late ${formData.value.name},`,
              size: 24,
            }),
          ],
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
              new TextRun({
                text: `We are reaching out to inform you of the upcoming expiration of the cemetery plot for your dearly departed. The burial plot currently occupied by ${formData.value.name} will expire on ${formatDisplayDate(formData.value.expirationDate)}.`,
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
                text: `Please coordinate with us no later than ${formatDisplayDate(formData.value.deadlineOfRenewal)} to avoid any inconvenience. For further information regarding the renewal process, fees, and any required documentation, feel free to contact our office directly at ${formData.value.contactNumber} or via email at ${formData.value.emailAddress}.`,
                size: 24,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `We understand that this is a sensitive matter, and we appreciate your attention to this notice to ensure the peaceful preservation of ${formData.value.name}'s resting place.`,
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
      a.download = `Renewal_of_Burial_Expired_${formData.value.name.replace(/\s+/g, '_')}.docx`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // Helper function to convert image to base64
  const getBase64Image = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL.split(',')[1]); // Return base64 string without the prefix
      };
      img.onerror = (error) => {
        reject(error);
      };
    });
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