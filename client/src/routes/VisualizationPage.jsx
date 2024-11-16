import React from 'react'
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { setVisibilities, renderVisualization, setToolGroupOpacity } from '../helpers/helpers';
import ReportScreen from '../components/ReportScreen/ReportScreen';
import NestedCheckBox from '../components/NestedCheckBox/NestedCheckBox';
import OpacitySlider from '../components/OpacitySlider/OpacitySlider';
import { create3DVolume, updateVisibilities, updateGeneralOpacity } from '../helpers/Volume3D';
import {  API_ORIGIN, DEFAULT_SEGMENTATION_OPACITY } from '../helpers/constants';
import { filenameToName } from '../helpers/util';
import { init as csRenderInit } from "@cornerstonejs/core"
import { init as csToolsInit } from "@cornerstonejs/tools"


import './VisualizationPage.css';





function VisualizationPage() {
  const [checkState, setCheckState] = useState([true]);
  const [segmentationRepresentationUIDs, setSegmentationRepresentationUIDs] = useState(null);
  const [NV, setNV] = useState();
  const [sessionKey, setSessionKey] = useState(undefined);
  const [checkBoxData, setCheckBoxData] = useState([]);
  const [opacityValue, setOpacityValue] = useState(DEFAULT_SEGMENTATION_OPACITY*100);
  const axial_ref = useRef();
  const sagittal_ref = useRef();
  const coronal_ref = useRef();
  const render_ref = useRef(null);

  const TaskMenu_ref = useRef(null);
  const ReportScreen_ref = useRef(null);
  const VisualizationContainer_ref = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    if (NV){
      console.log("HAS NV");
      console.log(NV);
    }
    else {  
      console.log("NO NV");
      console.log(NV);
    }
    const fetchNiftiFilesForCornerstoneAndNV = async () => {
      const state = location.state; 
      if (!state){
        window.alert('No Nifti Files Uploaded!');
        navigate('/');
        return;
      }

      await csRenderInit();
      await csToolsInit();

      const sessionKey = state.sessionKey;
      const fileInfo = state.fileInfo;
      setSessionKey(sessionKey);

      const masks = fileInfo.masks;
      const _checkBoxData = masks.map((filename, i) => {
        return {label: filenameToName(filename), id: i+1}
      })
      _checkBoxData.unshift({label: "Default (All)", id: 0})
      setCheckBoxData(_checkBoxData);
      setCheckState(Array(_checkBoxData.length).fill(true));

      const formData = new FormData();
      formData.append('sessionKey', sessionKey);
      formData.append('isSegmentation', true); 
 
      // const segmentationBuffers = await Promise.all(masks.map(async (mask) => {
      //   const response = await fetch(`${API_ORIGIN}/api/download/${mask}`, {
      //     method: 'POST',
      //     body: formData,
      //   });
      //   const buffer = await response.arrayBuffer();
      //   return {
      //     volumeId: mask,
      //     buffer: buffer
      //   }
      // }));

      // const mainNifti = fileInfo.MAIN_NIFTI;
      // const mainNiftiURL = URL.createObjectURL(mainNifti);

      await renderVisualization(axial_ref, sagittal_ref, coronal_ref, sessionKey)
      .then((UIDs) => setSegmentationRepresentationUIDs(UIDs));
      // const nv = await create3DVolume(render_ref, segmentationBuffers);
      // setNV(nv);
    }

    fetchNiftiFilesForCornerstoneAndNV();
  }, []);


  useEffect(() => {
    if (segmentationRepresentationUIDs && checkState && NV){
      console.log('update visibility');
      setVisibilities(segmentationRepresentationUIDs, checkState);
      updateVisibilities(NV, checkState);
    }
  }, [segmentationRepresentationUIDs, checkState, NV])

  const showTaskMenu = () => {
    if (TaskMenu_ref.current.style.display === "none"){
      TaskMenu_ref.current.style.display = "block"; 
    }
    else{
      TaskMenu_ref.current.style.display = "none";
    }
  }

  const showReportScreen = () => {
    if (ReportScreen_ref.current.style.display === "none"){
      ReportScreen_ref.current.style.display = "block";
      VisualizationContainer_ref.current.style.opacity = "25%";
    }
    else{
      ReportScreen_ref.current.style.display = "none";
      VisualizationContainer_ref.current.style.opacity = "100%";
    }

  }

  const update = (id, checked) => {
    let newCheckState = [...checkState];
    newCheckState[id] = checked;
    if (JSON.stringify(newCheckState) === JSON.stringify([false].concat(Array(checkBoxData.length-1).fill(true)))) newCheckState = Array(checkBoxData.length).fill(true); //Checks All tasks when everything except All tasks has been checked
    if (id !== 0 && checked === false && newCheckState[0] === true) newCheckState[0] = false; //Unchecks All tasks checkbox when making a segmentation transparent
    newCheckState = (id === 0) ? Array(checkBoxData.length).fill(checked) : newCheckState; //Pressing  All button
    setCheckState(newCheckState);
}

  const handleOpacityChange = (event) => {
    const _opacityValue = event.target.value;
    setOpacityValue(_opacityValue);
    setToolGroupOpacity(_opacityValue/100);
    updateGeneralOpacity(render_ref, _opacityValue/100);
  }



const navBack = () => {
  const formData = new FormData()
  formData.append('sessionKey', sessionKey)
  fetch(`${API_ORIGIN}/api/terminate-session`, {
    method: 'POST', 
    body: formData,
  }).then((response) => response.json())
  .then((data) => console.log(data.message))
  navigate('/');
}


 


  return (
    <div className="VisualizationPage">
      <div className="sidebar">
        <div className="tasks-container">
          <div className="dropdown">
            <div className="dropdown-header" onClick={showTaskMenu}>Selected Task</div>
            <NestedCheckBox checkBoxData={checkBoxData} innerRef={TaskMenu_ref} checkState={checkState} update={update} />
            <OpacitySlider opacityValue={opacityValue} handleOpacityChange={handleOpacityChange}/>
          </div>
        </div>
        <div className="report-container">
          <div className="dropdown">
            <div className="dropdown-header" onClick={showReportScreen}>Report</div>
          </div>
        </div>
        <button onClick={navBack}>Back</button>
        <br/>
        {/* <button onClick={() => {
          console.log(filenameToName('aorta.nii.gz'))
        }}> Debug </button> */}
      </div>
      
      <div className="visualization-container" ref={VisualizationContainer_ref} >
        <div className="axial" ref={axial_ref}></div>
        <div className="sagittal" ref={sagittal_ref}></div>
        <div className="coronal" ref={coronal_ref}></div>
        <div className="render">
          <div className="canvas">
            <canvas ref={render_ref}></canvas>
          </div>
        </div>
      </div>

      <div className="report" ref={ReportScreen_ref} style={{display: "none"}}>
        <ReportScreen sessionKey={sessionKey}/>
      </div>

    </div>
  )
}

export default VisualizationPage