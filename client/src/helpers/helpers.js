import {
    RenderingEngine,
    Enums,
    init as csInit,
    volumeLoader,
    setVolumesForViewports,
    getEnabledElements,
    getRenderingEngine,
    CONSTANTS,
    cache
  } from '@cornerstonejs/core';
import {
  init as csTools3dInit,
  StackScrollMouseWheelTool,
  ZoomTool,
  PanTool,
  ToolGroupManager,
  addTool,
  Enums as csToolsEnums, 
  SegmentationDisplayTool,
  segmentation,
  state as csToolState
}from '@cornerstonejs/tools';

import { cornerstoneNiftiImageVolumeLoader } from '@cornerstonejs/nifti-volume-loader';
import { defaultColors, DEFAULT_SEGMENTATION_OPACITY, APP_CONSTANTS  } from './constants';
import { createAndCacheVolumesFromArrayBuffers } from './createCSVolumes';

const toolGroupId = "myToolGroup";
const toolGroup3DId = "3DToolGroup";
const renderingEngineId = "myRenderingEngine";

const DEFAULT_SEGMENTATION_CONFIG = {
  fillAlpha: DEFAULT_SEGMENTATION_OPACITY,
  fillAlphaInactive: DEFAULT_SEGMENTATION_OPACITY,
  outlineOpacity: 1,
  outlineWidth: 1,
  renderOutline: false,
  
};

const toolGroupSpecificRepresentationConfig = {
  renderInactiveSegmentations: true,
  representations: {
    [csToolsEnums.SegmentationRepresentations.Labelmap]: DEFAULT_SEGMENTATION_CONFIG
  },
};




export async function renderVisualization(ref1, ref2, ref3, segmentationBuffers, mainNiftiURL){
  await createAndCacheVolumesFromArrayBuffers(segmentationBuffers);
  csTools3dInit();
  await csInit();

  ref1.current.oncontextmenu = (e) => e.preventDefault();
  ref2.current.oncontextmenu = (e) => e.preventDefault();
  ref3.current.oncontextmenu = (e) => e.preventDefault();

  
  addToolsToCornerstone();  
  const toolGroup = createToolGroup();

  toolGroup.addTool(StackScrollMouseWheelTool.toolName);
  toolGroup.addTool(SegmentationDisplayTool.toolName);
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(PanTool.toolName);

  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
  toolGroup.setToolEnabled(SegmentationDisplayTool.toolName);

  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{mouseButton: csToolsEnums.MouseBindings.Primary}],
  });

  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Secondary}],
  });

  volumeLoader.registerVolumeLoader('nifti', cornerstoneNiftiImageVolumeLoader);


  let renderingEngine = getRenderingEngine(renderingEngineId);
  if (renderingEngine){
    renderingEngine.destroy();  
    renderingEngine = new RenderingEngine(renderingEngineId); 
  } else {
    renderingEngine = new RenderingEngine(renderingEngineId); 
  }

  const volumeId = 'nifti:' + mainNiftiURL;
  const viewportId1 = 'CT_NIFTI_AXIAL';
  const viewportId2 = 'CT_NIFTI_SAGITTAL';
  const viewportId3 = 'CT_NIFTI_CORONAL'; 

  
  const volume = await volumeLoader.createAndCacheVolume(volumeId);

  const customColorLUT = {
    0: [0, 0, 0, 0],       // transparent for background
    1: APP_CONSTANTS.RED,
    2: APP_CONSTANTS.BLUE,   
    3: APP_CONSTANTS.MAROON,   
    4: APP_CONSTANTS.BROWN,
    5: APP_CONSTANTS.OLIVE,
    6: APP_CONSTANTS.TEAL,
    7: APP_CONSTANTS.PURPLE,
    8: APP_CONSTANTS.MAGENTA,
    9: APP_CONSTANTS.LIME,
    // Add more mappings as needed
  };

  const colorLUT = [];
  // Fill the colorLUT array with your custom colors
  Object.keys(customColorLUT).forEach(value => {
    colorLUT[value] = customColorLUT[value];
  });

  const segmentationInputArray = []
  const segRepInputArray = []
  segmentationBuffers.forEach((segInfo, i) => {
    const organId = segInfo.volumeId;
    segmentation.state.removeSegmentation(organId);
    segmentationInputArray.push(
      {
        segmentationId: organId,
        representation: {
          type: csToolsEnums.SegmentationRepresentations.Labelmap,
          data:{
            volumeId: organId,
          },
        },
      });
      segRepInputArray.push({
        segmentationId: organId,
        type: csToolsEnums.SegmentationRepresentations.Labelmap,
        options: {
          colorLUTOrIndex: colorLUT,
        },
      });
  });


  const viewportInputArray = [
      {
        viewportId: viewportId1, 
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: ref1.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.AXIAL,
        },
      },
      {
        viewportId: viewportId2,
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: ref2.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.SAGITTAL,
        },
      },
      {
        viewportId: viewportId3,
        type: Enums.ViewportType.ORTHOGRAPHIC,
        element: ref3.current, 
        defaultOptions: {
          orientation: Enums.OrientationAxis.CORONAL,
        },
      },
    ];

  renderingEngine.setViewports(viewportInputArray);

  toolGroup.addViewport(viewportId1, renderingEngineId);
  toolGroup.addViewport(viewportId2, renderingEngineId);
  toolGroup.addViewport(viewportId3, renderingEngineId);

  setVolumesForViewports(
      renderingEngine,
      [{ volumeId }],
      [viewportId1, viewportId2, viewportId3]
  );



  renderingEngine.render();
  console.log("volume rendered");

  segmentation.addSegmentations(segmentationInputArray);
  const segRepUIDs = await segmentation.addSegmentationRepresentations(toolGroupId, segRepInputArray, toolGroupSpecificRepresentationConfig);
  console.log("labelmaps rendered");
  return segRepUIDs;
}



function addToolsToCornerstone(){
  const addedTools = csToolState.tools;
  console.log(addedTools);
  if (!addedTools.StackScrollMouseWheel) addTool(StackScrollMouseWheelTool);
  if (!addedTools.SegmentationDisplay) addTool(SegmentationDisplayTool);
  if (!addedTools.Zoom) addTool(ZoomTool);
  if (!addedTools.Pan) addTool(PanTool);
}

function createToolGroup(){
  ToolGroupManager.destroyToolGroup(toolGroupId);
  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
  return toolGroup;
} 

let i = 0;
export const debug = async () => {
  
}
export function setVisibilities(segRepUIDs, checkState){
  let i = 1;  
  segRepUIDs.forEach((segRepUID) => {
    segmentation.config.visibility.setSegmentVisibility(toolGroupId, segRepUID, 1, checkState[i]);
    i++;
  });
};


export function setToolGroupOpacity(opacityValue){
  const newSegConfig = { ...DEFAULT_SEGMENTATION_CONFIG };
  newSegConfig.fillAlpha = opacityValue;
  newSegConfig.fillAlphaInactive = opacityValue;
  newSegConfig.outlineOpacity = opacityValue;
  newSegConfig.outlineOpacityInactive = opacityValue;

  const newToolGroupConfig = {
    renderInactiveSegmentations: true,
    representations: {
      [csToolsEnums.SegmentationRepresentations.Labelmap]: newSegConfig
    },
  };

  segmentation.config.setToolGroupSpecificConfig(toolGroupId, newToolGroupConfig);
}
