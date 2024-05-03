const ShapeLookup = {  //Look up table for shapes
    'Module': {
        type: 'circle',
        radiusFactor: 4,
        fill: 'lightgreen',
        xAdjustment: 0,
        yAdjustment: 0
    },
    'Course': {
        type: 'rect',
        widthFactor: 3.5,
        height: 30,
        rx: 10,
        ry: 10,
        fill: 'lightblue',
        xAdjustment: -30,
        yAdjustment: -15
    },
    'Learning Outcome': {
        type: 'polygon',
        pointsFactor: 2.5,
        points: '0,-10 {length * 7},0 {length * 10},30 0,30',
        fill: 'orange',
        xAdjustment: -25, // Adjusted x value for polygons
        yAdjustment: -15  // Adjusted y value for polygons
    },
    'Topic': {
        type: 'polygon',
        pointsFactor: 2.5,
        points: '0,0 {length * 7},0 {length * 10},40 0,30',
        fill: 'pink',
        xAdjustment: -25, // Adjusted x value for polygons
        yAdjustment: -15  // Adjusted y value for polygons
    },
    'Assessment': {
        type: 'polygon',
        pointsFactor: 2.5,
        points: '0,0 {length * 7},0 {length * 6},30 0,30',
        fill: 'yellow',
        xAdjustment: -25, // Adjusted x value for polygons
        yAdjustment: -15  // Adjusted y value for polygons
    }
};

class GraphVisualization {

    static SVG_NS = 'http://www.w3.org/2000/svg';
  
    constructor() {
        // Initialize properties
        window.addEventListener('load', function () {
        setTimeout(
            function open() { document.querySelector('.popup').style.display = 'block'; },
            10);
        });
        window.addEventListener('load', () => {
            this.startInfoUpdate(true);
        });

        document.querySelector('#close').addEventListener('click', function () { document.querySelector('.popup').style.display = 'none'; });

        this.svg = d3.select("svg");
        this.width = +this.svg.attr("width");
        this.height = +this.svg.attr("height");
        this.color = d3.scaleOrdinal(d3.schemeCategory10).domain(["CORE", "OPTIONAL", "HIDDEN", "LEVEL"]);
        this.el = {};

        
        document.querySelectorAll('[id]').forEach(e => this.el[e.id] = e);
  
        // Graph data initialization
        this.graphData = {links: [
            // {source: "Software Engineering", sourceType:"", target: "",targetType: "Course", type: ""},
            
            {source: "Software Engineering", sourceType:"Course", target: "SE L2",   targetType: "Learning Outcome",    type: "OPTIONAL"},
            {source: "Software Engineering", sourceType:"Course", target: "SE L3",   targetType: "Learning Outcome",    type: "LEVEL"},
            {source: "Software Engineering", sourceType:"Course", target: "Mark L1", targetType: "Learning Outcome",    type: "LEVEL"},
            {source: "Mark L1", sourceType:"Learning Outcome", target: "CARMA",      targetType: "Module",              type: "CORE"},
            {source: "Mark L1", sourceType:"Learning Outcome", target: "INDAD",      targetType: "Module",              type: "CORE"},
            {source: "Mark L1", sourceType:"Learning Outcome", target: "INTPROG",    targetType: "Module",              type: "CORE"},
            {source: "Mark L1", sourceType:"Learning Outcome", target: "NETFUN",     targetType: "Module",              type: "CORE"},
            {source: "Mark L1", sourceType:"Learning Outcome", target: "WEBF1",      targetType: "Module",              type: "CORE"},
            {source: "WEBF1", sourceType:"Module", target: "Topic-Mark",             targetType: "Topic",               type: "CORE"},
            {source: "Topic-Mark", sourceType:"Topic", target: "Assessment-Mark",    targetType: "Assessment",          type: "LEVEL"},                             
            ],
            nodes: [],
        }; 
        // Extract nodes from link data
        this.graphData.nodes = this.extractNodes(this.graphData);
        // Initialize force simulation
        this.simulation = d3.forceSimulation(this.graphData.nodes)
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collide", d3.forceCollide().radius(60).strength(0.8))
            .force("link", d3.forceLink(this.graphData.links).id(d => d.Name))
            .force("x", d3.forceX().strength(0.1).x(this.width / 2))
            .force("y", d3.forceY().strength(0.1).y(this.height / 2))
            .force("chargelink", d3.forceManyBody().strength(-10))
            .on("tick", this.ticked);
  
        // Initialize SVG elements
        this.links = this.svg.append("svg:g")
            .selectAll("line")
            .data(this.graphData.links)
            .enter()
  
            .append("svg:line")
            .attr("name", d => d.name)
            .attr("class", d => "link " + d.type)
            .attr("marker-end", d => "url(#" + d.type + ")");
  
        this.drag = d3.drag()
            .on("start", this.dragstarted)
            .on("drag", this.dragged)
            .on("end", this.dragended);
        
        //  ('Graph Data: ', this.graphData)
        this.textNode = this.svg
            .append("svg:g")
            .selectAll("g")
            .data(this.graphData.nodes)
            .enter()
            .append("svg:g")
            .attr("Class", d => {
                // Access level and targetType directly from the node data
                const levelLabel = d.sourceType === "Learning Outcome" ? "Learning Outcome" : (d.sourceType === "Course" ? "Course" : "Module");
                const targetTypeLabel = d.targetType === "Learning Outcome" ? "Learning Outcome" : (d.targetType === "Course" ? "Course" : "Module");
                
                // Construct the class attribute using the level and targetType labels
                return "Level - " + levelLabel + " TargetType - " + targetTypeLabel;
            })
            .attr("marker-end", d => {
                // Use targetType directly to set marker-end attribute
                return "url(#" + d.sourceType + ")";
            })
            
            .call(this.drag);

        this.shapes = this.textNode
            .append('g')
            .attr('class', 'node-shapes')
            .each(function(d) {
                const shapeProps = ShapeLookup[d.targetType];
                const textLength = d.Name.length;
                const shapeX = 30; // X position of the text
                const shapeY = 12.5; // Y position of the text

                // Append shapes based on targetType from the lookup table
                if (shapeProps) {
                    let shape;
                    if (shapeProps.type === 'circle') {
                        shape = d3.select(this).append('circle')
                            .attr('r', textLength * shapeProps.radiusFactor)
                            .attr('fill', shapeProps.fill)
                            .attr('transform', `translate(${shapeX}, ${shapeY})`);

                    } else if (shapeProps.type === 'rect') {
    
                        shape = d3.select(this).append('rect')
                            .attr('width', textLength * shapeProps.widthFactor)
                            .attr('height', shapeProps.height)
                            .attr('rx', shapeProps.rx)
                            .attr('ry', shapeProps.ry)
                            .attr('fill', shapeProps.fill)
                            .attr('transform', `translate(${shapeX + shapeProps.rectXAdjustment}, ${shapeY + shapeProps.rectYAdjustment})`);

                    } else if (shapeProps.type === 'polygon') {
                    
                        const points = `0,-10 ,${textLength * 9},0 ${textLength * 4},30, 0,30`;
                        shape = d3.select(this).append('polygon')
                            .attr('points', points)
                            .attr('fill', shapeProps.fill)
                            .attr('transform', `translate(${shapeX-(textLength*3.1)}, ${shapeY-(textLength)})`);

                    }
                }
            });
        
        this.texts = this.textNode
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("x", 30)
            .attr("y", 12.5).selectAll("tspan")
            .data(d => d.Name.split(' '))
            .enter()
            .append("tspan")
            .text(d => d)
            .attr("x", 30)
            .attr("dy", (d, i) => i * 8);
    }
        // Inside the constructor of GraphVisualization class
    // Append foreignObject elements with input boxes for text editing
    
  
    extractNodes(graphData) {
    let nodeMap = new Map();

    graphData.links.forEach(link => {
        // Add source node
        if (!nodeMap.has(link.source)) {
            nodeMap.set(link.source, {
                Name: link.source,
                sourceType: link.sourceType,
                targetType: "", // Initialize targetType
            });
        }
        // Add target node
        if (!nodeMap.has(link.target)) {
            nodeMap.set(link.target, {
                Name: link.target,
                sourceType: link.sourceType,
                targetType: link.targetType,
            });
        } else {
            // Update targetType if the node is created from the target
            const node = nodeMap.get(link.target);
            node.targetType = node.targetType || link.targetType; // Update targetType only if it's not defined yet
            nodeMap.set(link.target, node);
        }
    });

    // Convert the map values to an array and map it to include the required properties
    const nodes = Array.from(nodeMap.values()).map((node, index) => {
        return {
            ID: index,
            Name: node.Name,
            Type: node.sourceType || node.targetType, // Use sourceType if defined, otherwise use targetType
            targetType: node.targetType || node.sourceType, // Use targetType if defined, otherwise use sourceType
            x: 0,
            y: 0,
            vx: 0,
            vy: 0
        };
    });
    return nodes;
}

    
    
    ticked = () => {
        // Clip nodes within the SVG container
        this.textNode.attr("transform", d => `translate(${Math.max(0, Math.min(this.width - 50, d.x))},${Math.max(0, Math.min(this.height - 25, d.y))})`);
        this.links
            .attr("x1", d => Math.max(0, Math.min(this.width, d.source.x)+30))
            .attr("y1", d => Math.max(0, Math.min(this.height, d.source.y)+12.5))
            .attr("x2", d => Math.max(0, Math.min(this.width, d.target.x+30)))
            .attr("y2", d => Math.max(0, Math.min(this.height, d.target.y)+12.5))
  
    }
  
    dragstarted = (d) => {
        if (!d.active) this.simulation.alphaTarget(0.3).restart();
        d.subject.fx = d.subject.x;
        d.subject.fy = d.subject.y;
    }
  
    dragged = (d) => {
        d.subject.fx = Math.max(0, Math.min(this.width - 50, d.x));
        d.subject.fy = Math.max(0, Math.min(this.height - 50, d.y));
    }
  
    dragended = (d) => {
        if (!d.active) this.simulation.alphaTarget(0);
        d.subject.fx = null;
    }
  
   

    init() {
        // Prevent default behavior for dragover event
        window.addEventListener('dragover', e => e.preventDefault());
        // Accept drop events
        window.addEventListener('drop', e => this.acceptDrop(e));
    
        // Download SVG when the 'downloadsvg' element is clicked
        window.addEventListener('click', (event) => {
            if (event.target.id === 'downloadsvg'){
                this.downloadSVG();
            }
        });
    
        // Download JSON when any element is clicked
        window.addEventListener('click', () => this.downloadJSON());
    
        // Set the initial value of the information box to the JSON representation of graphData.nodes
        document.getElementById('info').value = JSON.stringify(this.graphData.nodes);
        console.log(JSON.stringify(this.graphData.nodes))
    
        // Add event listener for adding a node
        this.el.addnode.addEventListener('click', () => this.addNode());
    
        // Add event listener for deleting a node
        this.el.deletenode.addEventListener('click', () => this.delNode());
    
        // Add event listener for editing a node
        this.el.editnode.addEventListener('click', () => this.editNode());
    
        // Add event listener for adding a link
        this.el.addlink.addEventListener('click', () => this.addLink());
    
        // Add event listener for deleting a link
        this.el.deletelink.addEventListener('click', () => this.delLink());
    
        // Add event listener for double-clicking to add a node
        this.svg.on("dblclick", () => this.addNode());
    
        // Add event listeners for mouse actions related to adding a new node
        document.addEventListener('mousemove', this.handleNewNodeMouseMove);
        document.addEventListener('mouseup', this.handleNewNodeMouseUp);
    

        document.getElementById('Edit').addEventListener('click', () => this.toggleEditMode());

        document.getElementById('Save').addEventListener('click', () => this.saveChanges());
        // Start updating the information box with node coordinates every second
        this.startInfoUpdate();
    
    }

    toggleEditMode() {
        console.log('Edit clicked');
        const infoBox = document.getElementById('info');
    
        // Toggle the contentEditable attribute
        infoBox.contentEditable = 'true';
    
        clearInterval(this.infoUpdateInterval);
    }

    saveChanges() {
        // Get the edited content of the information box
        const editedContent = document.getElementById('info').value.trim();
    
        // Split the string into lines, filter out empty lines, and parse each line as JSON
        const editedNodes = editedContent.trim().split('\n')
            .filter(line => line.trim() !== '') // Filter out empty lines
            .map((line, index) => {
                return JSON.parse(line);
            });
    

        this.graphData.nodes.forEach((node, index) => {
            const editedNode = editedNodes.find(editedNode => editedNode.ID === node.ID);
            if (editedNode) {
                node.Name = editedNode.Name; // Update the node name
                this.graphData.nodes[index].Name = editedNode.Name; // Update the node name in the graphData
            
                const textElement = this.textNode.filter(d => d === node).select("text");

                // Update the text content of the <tspan> elements within the selected <text> element
                textElement.selectAll("tspan")
                    .text((d, i) => {
                        // Split the new node name by spaces for multiline display
                        const newNameParts = editedNode.Name.split(' ');
                        // Return the corresponding part of the new name
                        return newNameParts[i] ? newNameParts[i] : '';
                    });
                    }});
        
    
    
        // Update the node names in the links
        this.graphData.links.forEach(link => {
            const sourceNode = this.graphData.nodes.find(node => node.ID === link.source);
            const targetNode = this.graphData.nodes.find(node => node.ID === link.target);
    
            if (sourceNode) {
                link.source.Name = sourceNode.Name; // Update the source node name in the link
            }
    
            if (targetNode) {
                link.target.Name = targetNode.Name; // Update the target node name in the link
            }
        });
    

    
        // Redraw the graph with the updated node names
        this.redrawGraph(this.graphData);
    
        // Restart the automatic update of the information box content
        this.startInfoUpdate(true);
        
        const infoBox = document.getElementById('info');
        infoBox.contentEditable = 'false';

        alert('Changes have been saved!');
        // toggleEditMode();
    }
    
    startInfoUpdate(start) {
        // Start the automatic update of the information box content
        if (start) {
            
            this.infoUpdateInterval = setInterval(() => {
                // Extract the X, Y, VX, and VY coordinates of each node
                
                const nodeCoordinates = this.graphData.nodes.map(node => ({
                    ID: node.ID ,
                    Name: node.Name,
                    Type: node.targetType,
                    ConnectType: node.type,
                    X: node.x,
                    Y: node.y,
                    VX: node.vx,
                    VY: node.vy
                }));

                // Convert node coordinates to a formatted string with two newlines between each node
                const infoText = this.graphData.nodes.map(node => {
                    // Convert the node object to a string
                    const nodeString = JSON.stringify({
                        ID: node.ID,
                        Name: node.Name,
                        Type: node.targetType,
                        X: node.x,
                        Y: node.y,
                        VX: node.vx,
                        VY: node.vy,
                    });

                    // console.log(infoText)
                    
                    // Replace any spaces in the node name with underscores
                    if(node.Name.includes(" ")) { const formattedName = node.Name.replace(/\s/g, '_'); 
                    // Replace the original node name with the formatted one
                    return nodeString.replace(JSON.stringify(node.Name), JSON.stringify(formattedName))};

                    return nodeString;
                }).join('\n\n');
           
                // Update the content of the information box with the formatted string
                document.getElementById('info').value = infoText;
                this.updateInfoBox();
            }, 1000); // Update every second (1000 milliseconds)
        } else {
            // Clear the interval when exiting edit mode
            clearInterval(this.infoUpdateInterval);
        }
    }

    updateInfoBox(nodeInfo) {
        if (nodeInfo){
            // Convert node information to a string
            const infoText = JSON.stringify(nodeInfo);
        
            // Update the content of the text box with the node information
            const infoBox = document.getElementById('info');
            infoBox.value = infoText;
        
            // Clear previous highlights
            infoBox.classList.remove('highlighted');
        
            // Highlight the relevant node information
            const nodeIndex = this.graphData.nodes.findIndex(node => node.name === nodeInfo.name);
            if (nodeIndex !== -1) {
                // Calculate the start and end positions of the highlighted text
                const startIndex = infoText.indexOf(nodeInfo.name);
                const endIndex = startIndex + nodeInfo.name.length;
        
                // Highlight the text
                infoBox.setSelectionRange(startIndex, endIndex);
        
                // Add a CSS class to visually highlight the text
                infoBox.classList.add('highlighted');
                console.log("highlighted");
            }
        }
    }
    
    
    acceptDrop(e) {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f.type === 'application/json') {
            this.readJSONFile(f);
        } else if (f.type === 'image/svg+xml') {
            this.readSVGFile(f);
        }
    }

    gatherInputData(jsonData) {
        const nodes = jsonData.nodes;
        const links = jsonData.links.map(link => {
            return {
                source: link.source.Name,
                target: link.target.Name,
                type: link.type
            };
        });
    
        return { nodes, links };
    }
    
    readJSONFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const jsonData = JSON.parse(reader.result)
                const graphData = this.gatherInputData(jsonData);
                this.addDataToUI(graphData);
            } catch (error) {
                console.error(error);
                alert("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    }
  
    readSVGFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const parts = reader.result.split('sEpArAt0r');
            this.addDataToUI(JSON.parse(parts[1]));
        };
        reader.readAsText(file);
    }
  
    addDataToUI(data) {
        if (data.nodes && data.links) {
            this.graphData.nodes = data.nodes;
            this.graphData.links = data.links;
    
            // Update existing SVG elements without clearing
            this.updateSVGElements();
            this.simulation.nodes(this.graphData.nodes);
            this.simulation.force("link").links(this.graphData.links);
            this.simulation.alpha(1).restart();
    
            // Update the positions of existing nodes in the textNode group
            this.textNode.attr("transform", d => `translate(${Math.max(0, Math.min(this.width - 50, d.x))},${Math.max(0, Math.min(this.height - 25, d.y))})`);
        }
    }
    
    updateSVGElements() {

        this.links = this.links.data(this.graphData.links, d => `${d.source.name}-${d.target.name}`);
        this.links.exit().remove();
    
        this.textNode = this.textNode.data(this.graphData.nodes, d => d.name);
    
        // Remove elements that are no longer needed
        this.links.exit().remove();
        this.textNode.exit().remove();

        
        const newLinks = this.links.enter()
            .append("svg:line")
            .attr("class", d => `link ${d.type}`)
            .attr("marker-end", d => `url(#${d.type})`);

        this.links = newLinks.merge(this.links);

        this.textNode.selectAll("text tspan")
            .data(d => d.Name.split(' '))
            .text(d => d);
        
        this.textNode.exit().remove();
    
        // Enter new nodes
        const newNodeGroups = this.textNode.enter()
            .append("g")
            .call(this.drag)
    
        // Append shapes based on node type
            .each(function(d) {

            const shapeProps = ShapeLookup[d.targetType ];
            const textLength = d.Name.length;
            const shapeX = 30; // X position of the text
            const shapeY = 12.5; // Y position of the text
            if (shapeProps) {
                let shape;
                if (shapeProps.type === 'circle') {
                    shape = d3.select(this).append('circle')
                        .attr('r', textLength * shapeProps.radiusFactor)
                        .attr('fill', shapeProps.fill)
                        .attr('transform', `translate(${shapeX}, ${shapeY})`);
        
                } else if (shapeProps.type === 'rect') {
        
                    shape = d3.select(this).append('rect')
                        .attr('width', textLength * shapeProps.widthFactor)
                        .attr('height', shapeProps.height)
                        .attr('rx', shapeProps.rx)
                        .attr('ry', shapeProps.ry)
                        .attr('fill', shapeProps.fill)
                        .attr('transform', `translate(${shapeX - shapeProps.rectXAdjustment}, ${shapeY + shapeProps.rectYAdjustment})`);
        
                } else if (shapeProps.type === 'polygon') {
                
                    const points = `0,-10 ,${textLength * 9},0 ${textLength * 4},30, 0,30`;
                    shape = d3.select(this).append('polygon')
                        .attr('points', points)
                        .attr('fill', shapeProps.fill)
                        .attr('transform', `translate(${shapeX-(textLength*3.1)}, ${shapeY-(textLength)})`);
        
                }
            }
           
            this.texts = d3.select(this).append("text")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("x", 30)
                .attr("y", 12.5).selectAll("tspan")
                .data(d => d.Name.split(' '))
                .enter()
                .append("tspan")
                .text(d => d.replace(/_/g, ' '))
                .attr("x", 30)
                .attr("dy", (d, i) => i * 8);

        });
        
        this.textNode = newNodeGroups.merge(this.textNode);

    }

    
    
    
    
    redrawGraph(data) {
        const graphData = data;
    
        this.graphData.nodes = graphData.nodes;
        this.graphData.links = graphData.links;
            
        this.updateSVGElements(graphData);
    
        // Update node positions
        this.textNode.attr("transform", d => `translate(${Math.max(0, Math.min(this.width - 50, d.x))},${Math.max(0, Math.min(this.height - 25, d.y))})`);
    }

    addNode() {
        // Get input values from the user
        const Name = prompt("Enter Node Name: ");
        const Level = prompt("Enter Node Type: ");
        const Connected_To = prompt("Enter target : ");
        const linkType = prompt("Enter Link Type: ");
    
        // Check if target node exists
        if (Name) {
        const existingNode = this.graphData.nodes.find(node => {
            const nodeNameToCompare = typeof node.Name === 'object' ? node.Name.Name : node.Name;
            return nodeNameToCompare === Connected_To;
        });
    
        if (existingNode) {
            // Generate a unique ID for the new node
            
    
            // Create the new node object
            const newNode = {
                ID: (((this.graphData.nodes).length)),
                Name: Name,
                Type: Level,
                targetType: Level,
                x: 400,
                y: 400,
            };

    
            // Add the new node to the graph data
            this.graphData.nodes.push(newNode);
    
            // Add a new link to the links array, connecting to the existing target node
            this.graphData.links.push({
                source: existingNode,
                sourceType: Level,
                target: newNode,
                targetType: Level,
                type: linkType
            });
    
            // Redraw the graph with the modified graphData
            
            this.redrawGraph(this.graphData);
            this.simulation.nodes(this.graphData.nodes);
            this.simulation.force("link").links(this.graphData.links);
            this.simulation.alpha(1).restart();
            
        } else {
            alert("Target node not found");
        }
    }
    info.value = JSON.stringify(this.graphData.nodes);
    }
    

    delNode() {
        const nodeID = parseInt(prompt("Enter Node ID: "));
        if (!isNaN(nodeID)){
            // Find the index of the node to be deleted
            const node = this.graphData.nodes.find(node => node.id === nodeID);
            const index = this.graphData.nodes.findIndex(node => node.ID === nodeID);
   
            if (index !== -1) {
                // Remove the node from the nodes array
                this.graphData.nodes.splice(index, 1);
    
                // Remove any links that reference the deleted node
                this.graphData.links = this.graphData.links.filter(link => link.source.ID !== nodeID && link.target.ID !== nodeID);
                
                 // Remove corresponding SVG elements
                d3.select(`#node-${nodeID}`).remove();
                d3.selectAll(`.link[source-node="${nodeID}"], .link[target-node="${nodeID}"]`).remove();


                // Update the simulation and redraw the graph
                // this.updateSimulation(this.graphData);
                this.redrawGraph(this.graphData);
                this.simulation.nodes(this.graphData.nodes);
                this.simulation.force("link").links(this.graphData.links);
                this.simulation.alpha(1).restart();
                
            } else {
                alert("Node with ID " + nodeID + ' not found');
            }
        } else {
            alert("Invalid Node ID");
        }
        info.value = JSON.stringify(this.graphData.nodes);
    }


    editNode() {
    const nodeID = parseInt(prompt("Enter Node ID: "));
    const newNodeName = prompt("Enter New Node Name: ");

    if ( !isNaN(nodeID) && newNodeName) {
        // Find the node to be edited
        const node = this.graphData.nodes.find(node => node.index === (nodeID));
        const index = this.graphData.nodes.findIndex(node => node.ID === nodeID);
        
        if (node) {
            // Update the node name
            node.name = newNodeName;

            // Select the <text> element corresponding to the edited node
            const textElement = this.textNode.filter(d => d === node).select("text");

            // Update the text content of the <tspan> elements within the selected <text> element
            textElement.selectAll("tspan")
                .text((d, i) => {
                    // Split the new node name by spaces for multiline display
                    const newNameParts = newNodeName.split(' ');
                    // Return the corresponding part of the new name
                    return newNameParts[i] ? newNameParts[i] : '';
                });


            this.graphData.nodes[index].Name = newNodeName;
            // Update the simulation and redraw the graph
            this.redrawGraph(this.graphData);
            this.simulation.nodes(this.graphData.nodes);
            this.simulation.force("link").links(this.graphData.links);
            this.simulation.alpha(1).restart();
            
        }
        else {
            alert("Node not found");
        }
    } else {
        alert("Invalid input");
    }
    info.value = JSON.stringify(this.graphData.nodes);
}
    
    addLink(){
        const sourceNode = prompt("Enter Source Node: ");
        const targetNode = prompt("Enter Target Node: ");
        const linkType = prompt("Enter Link Type: ");

        if (sourceNode && targetNode) {
            // Find the source and target nodes
            const source = this.graphData.nodes.find(node => node.Name === sourceNode);
            const target = this.graphData.nodes.find(node => node.Name === targetNode);

            if (source && target) {
                // Append the new link to the links array
                this.graphData.links.push({
                    index: this.graphData.links.length,
                    source: source,
                    sourceType: source.Type,
                    target: target,
                    targetType: target.Type,
                    type: linkType
                });
    
                // Update the simulation with the modified graphData
                // this.updateSimulation(this.graphData);
    
                // Redraw the graph with the modified graphData
                this.redrawGraph(this.graphData);
                this.simulation.nodes(this.graphData.nodes);
                this.simulation.force("link").links(this.graphData.links);
                this.simulation.alpha(1).restart();
            } else {
                alert("Source or target node not found");
            }
        } else {
            alert("Invalid source or target node");
        }
        info.value = JSON.stringify(this.graphData.nodes);
    }

    delLink(){
        const sourceNode = prompt("Enter Source Node: ");
        const targetNode = prompt("Enter Target Node: ");

        if (sourceNode && targetNode) {
            // Find the index of the link to be deleted
            const index = this.graphData.links.findIndex(link => link.source.Name === sourceNode && link.target.Name === targetNode);
            
            if (index > -1) {
                // Remove the link from the links array
                this.graphData.links.splice(index, 1);

                // Update the simulation and redraw the graph
                // this.updateSimulation(this.graphData);
                this.redrawGraph(this.graphData);
            } else {
                alert("Link not found");
            }
        } else {
            alert("Invalid source or target node");
        }
        info.value = JSON.stringify(this.graphData.nodes);
    }

    downloadSVG = () => {
        try {
            // Clone the SVG element
            const svgClone = this.svg.node().cloneNode(true);
    
            // Append links to the SVG clone
            const group = svgClone.querySelector('g');
            this.graphData.links.forEach(link => {
                const line = document.createElementNS(GraphVisualization.SVG_NS, 'line');
                line.setAttribute('class', `link ${link.type}`);
                line.setAttribute('marker-end', `url(#${link.type})`);
                
                // Set stroke color based on link type using the color scale
                line.setAttribute('stroke', this.color(link.type));

                // Set other attributes as needed, e.g., stroke-dasharray
                if (link.type === 'OPTIONAL') {
                    line.setAttribute('stroke-dasharray', '5,5');
                }

                // Find source and target nodes
                const sourceNode = this.graphData.nodes.find(node => node.Name === link.source.Name);
                const targetNode = this.graphData.nodes.find(node => node.Name === link.target.Name);

                // Calculate link start and end points based on node positions and dimensions
                const x1 = sourceNode.x + 30; // Adjusted for rectangle width
                const y1 = sourceNode.y + 12.5; // Adjusted for half of rectangle height
                const x2 = targetNode.x + 30; // Adjusted for rectangle width
                const y2 = targetNode.y + 12.5; // Adjusted for half of rectangle height

                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);

                group.appendChild(line);
            });
    
            // Serialize the entire clone
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgClone);
    
            // Create a Blob and generate a URL
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
    
            // Update the download link
            const a = document.createElement('a');
            a.href = url;
            a.download = 'graph_with_links.svg';
            a.click();
    
            // Cleanup
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            this.handleDownloadError();
        }
    }
    
    downloadJSON = () => {
        try {
            const jsonData = JSON.stringify(this.graphData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
  
            this.el.downloadjson.href = url;
            this.el.downloadjson.download = 'graphData.json';
        } catch (e) {
            console.error(e);
            this.handleDownloadError();
        }
    }

    handleDownloadError = () => {
        delete this.el.downloadsvg.href;
        this.el.downloadsvg.textContent = 'Cannot download SVG';
        this.el.downloadsvg.title = 'Error while generating download link';
    }
      svgX = (name, attributes = {}) => {
        const el = document.createElementNS(GraphVisualization.SVG_NS, name);
        for (const attr of Object.keys(attributes)) {
          el.setAttribute(attr, attributes[attr]);
        }
        return el;
      }
    }

  const graphViz = new GraphVisualization();
  graphViz.init();