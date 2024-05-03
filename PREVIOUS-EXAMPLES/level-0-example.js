class GraphVisualization {
    static SVG_NS = 'http://www.w3.org/2000/svg';
  
    constructor() {
        // Initialize properties
        this.svg = d3.select("svg");
        this.width = +this.svg.attr("width");
        this.height = +this.svg.attr("height");
        this.color = d3.scaleOrdinal(d3.schemeCategory10).domain(["core", "optional", "hidden", "level"]);
        this.el = {};
        document.querySelectorAll('[id]').forEach(e => this.el[e.id] = e);
  
        // Event listener for SVG download button
        // this.el.downloadsvg.addEventListener('click', () => this.downloadSVG());
  
        // Graph data initialization
        this.graphData = {
          links: [
            {source: "id:1", type: "name", target: "Web Technologies"},
            {source: "id:1", type: "type", target: "id:course"},
            {source: "id:1", type: "year", target: "id:y1"},
            {source: "id:1", type: "year", target: "id:y2"},
            {source: "id:1", type: "year", target: "id:y3"},
            {source: "id:y1", type: "name", target: "Year 1"},
            {source: "id:y2", type: "name", target: "Year 2"},
            {source: "id:y3", type: "name", target: "Year 3"},
          ],
          nodes: [],
        };

/* 
id:10 name "Web technologies"
id:10 type id:course
id:10 year "year 1"
id:10 year "year 2"
id:10 year "year 3"

id:10 name "Web technologies"
id:10 type id:course
id:10 year id:11
id:10 year id:12
id:10 year id:13
id:11 name "Year 1"
id:12 name "Year 2"
id:13 name "Year 3"

id:10 name "Web technologies"
id:10 type id:course
id:10 year id:y1
id:10 year id:y2
id:10 year id:y3
id:y1 name "Year 1"
id:y2 name "Year 2"
id:t3 name "Year 3"
*/


        // Extract nodes from link data
        this.graphData.nodes = this.extractNodes(this.graphData);
  
        // Initialize force simulation
        this.simulation = d3.forceSimulation(this.graphData.nodes)
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collide", d3.forceCollide().radius(30).strength(0.8))
            .force("link", d3.forceLink(this.graphData.links).id(d => d.name))
            .force("x", d3.forceX().strength(0.1).x(this.width / 2))
            .force("y", d3.forceY().strength(0.1).y(this.height / 2))
            .on("tick", this.ticked);
  
        // Initialize SVG elements
        this.links = this.svg.append("svg:g")
            .selectAll("line")
            .data(this.graphData.links)
            .enter()
  
            .append("svg:line")
            .attr("class", d => "link " + d.type)
            .attr("marker-end", d => "url(#" + d.type + ")");
  
        this.drag = d3.drag()
            .on("start", this.dragstarted)
            .on("drag", this.dragged)
            .on("end", this.dragended);
  
        this.textNode = this.svg.append("g")
            .selectAll("g")
            .data(this.graphData.nodes)
            .enter()
            .append("g")
            .call(this.drag);
  
        this.rectangles = this.textNode
            .append('rect')
            .attr('width', 60)
            .attr('height', 25)
            .attr("fill", d => this.color(d.group));
  
        this.texts = this.textNode
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("x", 30)
            .attr("y", 12.5).selectAll("tspan")
            .data(d => d.name.split(' '))
            .enter()
            .append("tspan")
            .text(d => d)
            .attr("x", 30)
            .attr("dy", (d, i) => i * 8);
    }
  
    extractNodes(graphData) {
        let nodeSet = new Set();
        graphData.links.forEach(link => {
            nodeSet.add(link.source);
            nodeSet.add(link.target);
        });
        const nodes = Array.from(nodeSet).map(node => {
            return { name: node };
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
        window.addEventListener('resize', this.resize);
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => this.acceptDrop(e));

        this.el.downloadsvg.addEventListener('click', () => this.downloadSVG());
        this.el.downloadjson.addEventListener('click', () => this.downloadJSON());
        
        this.el.addnode.addEventListener('click', () => this.addNode())
        this.el.deletenode.addEventListener('click', () => this.delNode())
        this.svg.on("dblclick", () => this.addNode());
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
            this.redrawGraph(data);
        }
    }
  
    redrawGraph(data) {
        const graphData = data;

        this.graphData.nodes = graphData.nodes;
        this.graphData.links = graphData.links;
    
        // Update simulation with new nodes and links
        this.simulation.nodes(this.graphData.nodes);
        this.simulation.force("link").links(this.graphData.links);
        this.simulation.alpha(1).restart();
    
        // Update existing SVG elements without clearing
        this.updateSVGElements();
    }

    addNode() {
        const nodeName = prompt("Enter Node Name: ");
        const targetNode = prompt("Enter Target Node: ");
        const linkType = prompt("Enter Link Type: ");
    
        if (nodeName) {
            // Check if the node already exists
            const existingNode = this.graphData.nodes.find(node => {
                const nodeNameToCompare = typeof node.name === 'object' ? node.name.name : node.name;
                return nodeNameToCompare === targetNode;
            });
    
            if (existingNode) {
                // Append the new node to the nodes array

                const newNode = { name: nodeName,x: 400, y: 400 };

                this.graphData.nodes.push(newNode);
  
    
                // Append the new link to the links array, connecting to the existing target node
                this.graphData.links.push({
                    source: existingNode,
                    target: newNode,
                    type: linkType
                });
        
                // Update the simulation with the modified graphData
                // this.updateSimulation(this.graphData);
    
                // Redraw the graph with the modified graphData
                this.redrawGraph(this.graphData);
            } else {
                alert("Target node not found");
            }
        }
    }
    

    
    delNode() {
        const nodeName = prompt("Enter Node Name: ");
        if (nodeName) {
            // Find the index of the node to be deleted
            const index = this.graphData.nodes.findIndex(node => node.name === nodeName);
    
            if (index > -1) {
                // Remove the node from the nodes array
                this.graphData.nodes.splice(index, 1);
    
                // Remove any links that reference the deleted node
                this.graphData.links = this.graphData.links.filter(link => link.source.name !== nodeName && link.target.name !== nodeName);
    
                // Update the simulation and redraw the graph
                // this.updateSimulation(this.graphData);
                this.redrawGraph(this.graphData);
            } else {
                alert("Node not found");
            }
        } else {
            alert("Invalid Node Name");
        }
    }
    
    updateSVGElements() {
        // Update links
        this.links = this.links.data(this.graphData.links, d => `${d.source.name}-${d.target.name}`);
        this.links.exit().remove();
    
        const newLinks = this.links.enter()
            .append("svg:line")
            .attr("class", d => "link " + d.type)
            .attr("marker-end", d => "url(#" + d.type + ")");


        this.links = newLinks.merge(this.links);
            
        // Update nodes
        this.textNode = this.textNode.data(this.graphData.nodes, d => d.name.name);

        this.textNode.exit().remove();

        const newNodeGroups = this.textNode.enter()
            .append("g")
            .call(this.drag);

        const newRectangles = newNodeGroups
            .append('rect')
            .attr('width', 60)
            .attr('height', 25)
            .attr("fill", d => this.color(d.group));

        const newTexts = newNodeGroups
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("x", 30)
        .attr("y", 12.5)
        .selectAll("tspan")
        .data(d => {
            return Array.isArray(d.name) ? d.name : [d.name];
        })
        .enter()
        .append("tspan")
        .text(d => {
            if (typeof d === 'object' && d.name) {

                return d.name; // If it's an object, use the 'name' property
            } else {

                return d; // Otherwise, use the value directly
            }
        })
        .attr("x", 30)
        .attr("dy", (d, i) => i * 8);
        

        this.textNode = this.textNode.merge(newNodeGroups);
        

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
                if (link.type === 'optional') {
                    line.setAttribute('stroke-dasharray', '5,5');
                }

                // Find source and target nodes
                const sourceNode = this.graphData.nodes.find(node => node.name === link.source.name);
                const targetNode = this.graphData.nodes.find(node => node.name === link.target.name);

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