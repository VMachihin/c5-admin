import { Dropzone } from 'dropzone'

import { sendData, showBigImgModal, showInfoModal } from '../_functions'
import { cutString } from './cutStrings'

const genDropzones = document.querySelectorAll('.general-dropzone')

if (genDropzones) {
  genDropzones.forEach((dropzoneEl) => {
    const addBtn = dropzoneEl
      .closest('.general-dropzone-wrapper')
      ?.querySelector('.general-dropzone__add-btn')

    const previewsWrapper = dropzoneEl
      .closest('.general-dropzone-wrapper')
      ?.querySelector('.general-dropzone__previews')

    const amountFiles = dropzoneEl
      .closest('.general-dropzone-wrapper')
      ?.querySelector('.general-dropzone-amount')

    const existingFiles = dropzoneEl
      .closest('.general-dropzone-wrapper')
      .querySelectorAll('.dz-preview')

    const isBigPreview = dropzoneEl.dataset.showPreview

    const hiddenOnLoadElements = dropzoneEl.querySelectorAll('._hidden-on-load')

    // Обновление счетчика файлов
    const updateAmountFiles = () => {
      if (amountFiles) {
        amountFiles.textContent = dropzoneEl
          .querySelectorAll('.dz-preview')
          .length.toString()
      }
    }

    // Добавление просмотра большой версии превью

    const onShowBig = (file) => {
      if (isBigPreview) {
        const previewPic = file.previewElement
        if (previewPic) {
          const previewImg = previewPic.querySelector('img')
          let reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            previewImg.setAttribute('data-big-img', reader.result)
            previewPic.addEventListener('click', () => {
              showBigImgModal(reader.result)
            })
          }
        }
      }
    }

    const dataObj = JSON.parse(dropzoneEl.dataset.generalInfo)
    let {
      url,
      width,
      height,
      type,
      filesCount,
      removeUrl,
      additional,
      acceptedFiles,
      customText,
    } = dataObj

    const newGenDropzone = new Dropzone(dropzoneEl, {
      maxFilesize: 5,
      url: url,
      maxFiles: filesCount,
      acceptedFiles: acceptedFiles,
      addRemoveLinks: true,
      thumbnailWidth: width,
      thumbnailHeight: height,
      previewsContainer: previewsWrapper || null,
      clickable: addBtn || '.dz-message',
      accept: function (file, done) {
        const uploadedFiles = dropzoneEl.querySelectorAll('.dz-preview')

        if (uploadedFiles.length > +this.options.maxFiles) {
          done('Превышено максимальное количество файлов!')
        } else {
          done()
        }
      },
      removedfile: async function (file) {
        const data = {
          filetype: type,
          id_file: file._removeLink.dataset.id,
        }

        const jsonData = JSON.stringify(data)
        const response = await sendData(jsonData, removeUrl)
        const finishedResponse = await response.json()

        const { status, errortext } = finishedResponse

        if (status === 'ok') {
          if (
            file.previewElement != null &&
            file.previewElement.parentNode != null
          ) {
            file.previewElement.parentNode.removeChild(file.previewElement)

            if (
              dropzoneEl.querySelectorAll('.dz-preview').length < filesCount
            ) {
              addBtn?.classList.remove('btn_disabled')
              hiddenOnLoadElements?.forEach((el) =>
                el.classList.remove('hidden'),
              )
            }
            if (dropzoneEl.querySelectorAll('.dz-preview').length === 0) {
              const uploadContainer = dropzoneEl.querySelector(
                '.upload-photos__info',
              )
              if (uploadContainer) {
                const uploadFileDescs =
                  uploadContainer.querySelectorAll('.file-info-desc')
                if (uploadFileDescs && uploadFileDescs.length > 1) {
                  uploadFileDescs[1].classList.toggle('_active')
                  uploadFileDescs[0].classList.toggle('_active')
                }
              }
            }
            updateAmountFiles()
          }
        } else {
          showInfoModal(errortext)
        }
      },
    })

    newGenDropzone.on('maxfilesexceeded', function () {
      showInfoModal('Превышено максимальное количество файлов!')
    })

    newGenDropzone.on('sending', function (file, xhr, formData) {
      formData.append('filetype', type)
      formData.append('additional', additional)

      if (addBtn?.dataset.id) {
        formData.append('id_item', addBtn.dataset.id)
      }
    })

    newGenDropzone.on('error', function (file, errorMessage) {
      if (customText) {
        showInfoModal(customText)
      } else {
        showInfoModal(errorMessage ?? 'Ошибка 404')
      }
      file.previewElement.parentNode.removeChild(file.previewElement)
    })

    newGenDropzone.on('success', function (file, response) {
      const resObj =
        typeof response === 'string' ? JSON.parse(response) : response
      const { status, errortext, id_person } = resObj
      if (status !== 'ok') {
        showInfoModal(errortext)
        file.previewElement.parentNode.removeChild(file.previewElement)
      } else {
        const cutTitles = dropzoneEl.querySelectorAll('span[data-dz-name]')
        const uploadContainer = dropzoneEl.querySelector('.upload-photos__info')
        if (uploadContainer) {
          const uploadFileDescs =
            uploadContainer.querySelectorAll('.file-info-desc')
          if (uploadFileDescs && uploadFileDescs.length > 1) {
            if (dropzoneEl.querySelectorAll('.dz-preview').length === 1) {
              uploadFileDescs[0].classList.toggle('_active')
              uploadFileDescs[1].classList.toggle('_active')
            }
          }
        }

        if (dropzoneEl.querySelectorAll('.dz-preview').length >= filesCount) {
          addBtn?.classList.add('btn_disabled')
          hiddenOnLoadElements?.forEach((el) => el.classList.add('hidden'))
        }

        if (cutTitles) {
          cutString(cutTitles, 12)
        }

        updateAmountFiles()
        onShowBig(file)
        file._removeLink.setAttribute('data-id', id_person)
        const uploadImg = file.previewElement.querySelector('img')
        uploadImg.setAttribute('data-size', file.size)
      }
    })

    if (existingFiles.length > 0) {
      if (existingFiles.length >= filesCount) {
        addBtn?.classList.add('btn_disabled')
        hiddenOnLoadElements?.forEach((el) => el.classList.add('hidden'))
      }
      updateAmountFiles()
      existingFiles.forEach((el) => {
        const deleteBtn = el.querySelector('.dz-remove')

        if (isBigPreview) {
          const previewImg = el.querySelector('.dz-image img')
          if (previewImg) {
            previewImg.addEventListener('click', () => {
              showBigImgModal(previewImg.dataset.bigImg)
            })
          }
        }

        deleteBtn.addEventListener('click', async (e) => {
          const data = {
            filetype: type,
            id_file: e.target.dataset.id,
          }
          const jsonData = JSON.stringify(data)
          const response = await sendData(jsonData, removeUrl)
          const finishedResponse = await response.json()

          const { status, errortext } = finishedResponse
          if (status === 'ok') {
            el.parentNode.removeChild(el)
            if (
              dropzoneEl.querySelectorAll('.dz-preview').length < filesCount
            ) {
              addBtn?.classList.remove('btn_disabled')
              hiddenOnLoadElements?.forEach((el) =>
                el.classList.remove('hidden'),
              )
            }
            updateAmountFiles()
          } else {
            showInfoModal(errortext)
          }
        })
      })
    }
  })
}
