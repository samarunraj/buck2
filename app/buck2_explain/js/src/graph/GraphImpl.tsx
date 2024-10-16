/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under both the MIT license found in the
 * LICENSE-MIT file in the root directory of this source tree and the Apache
 * License, Version 2.0 found in the LICENSE-APACHE file in the root directory
 * of this source tree.
 */

import React, {useRef, useState} from 'react'
import {Build} from '../fbs/explain'
import {RuleTypeDropdown} from './RuleTypeDropdown'
import {Node} from './GraphView'
import {GraphViz} from './GraphViz'
import {LinkObject, NodeObject} from 'react-force-graph-2d'

enum NodeSizeOption {
  transitiveDeps,
  transitiveSrcs,
}

enum DisplayType {
  rootNode,
  passesFilters,
  somepath,
  hidden,
}

interface DisplayNode extends Node {
  allowedDeps: Map<number, number>
  displayType: DisplayType
}

function showNode(node: DisplayNode) {
  return node.displayType != DisplayType.hidden
}

// Here it goes everything that should reload on user interaction
export function GraphImpl(props: {
  nodes: Map<number, Node>
  build: Build
  maxSrcs: number
  allTargets: {[key: string]: number}
  categoryOptions: {category: string; count: number; checked: boolean}[]
}) {
  const {nodes, build, categoryOptions, allTargets, maxSrcs} = props

  const nodeMap: Map<number, DisplayNode> = new Map()
  for (const [k, node] of nodes) {
    nodeMap.set(k, {...node, allowedDeps: new Map(), displayType: DisplayType.hidden})
  }

  const [categories, setCategories] = useState(categoryOptions)
  const [colorByCfg, setColorByCfg] = useState(false)
  const [includeContaining, setIncludeContaining] = useState<string[]>([])
  const [excludeContaining, setExcludeContaining] = useState<string[]>([])
  const [somepath, setSomepath] = useState<Set<number>>(new Set())
  const [selectedOption, setSelectedOption] = useState(NodeSizeOption.transitiveDeps)

  const activeCategories = categories.filter(v => v.checked).map(v => v.category)

  if (somepath.size > 0) {
    for (const k of somepath) {
      nodeMap.get(k)!.displayType = DisplayType.somepath
    }
  } else {
    // Intersection of 'includes', minus 'excludes'
    for (const [k, node] of nodeMap) {
      const target = build.targets(k)!
      const label = target.configuredTargetLabel()!

      // When null, means it wasn't affected by any of the filters and to use default
      let passesFilters = null

      // Filter by category
      if (activeCategories.length > 0) {
        passesFilters = activeCategories.includes(target.type()!)
      }

      // Filter by label
      if (includeContaining.length > 0) {
        let contains = false
        for (const v of includeContaining) {
          if (label.includes(v)) {
            contains = true
            break
          }
        }
        passesFilters = passesFilters !== false && contains
      }

      // Exclude by label
      for (const v of excludeContaining) {
        if (label.includes(v)) {
          passesFilters = false
        }
      }

      if (passesFilters === true) {
        node.displayType = DisplayType.passesFilters
      }
    }

    // Always set root node
    nodeMap.get(0)!.displayType = DisplayType.rootNode
  }

  let filteredNodes = new Map()
  for (const [k, node] of nodeMap) {
    if (showNode(node)) {
      filteredNodes.set(k, node)
    }
  }

  // For each node A that goes, traverse the graph bottom up BFS
  // until another node that goes is found, then add node A as allowedDep
  // Also stores shortest path length from last allowed to later add as edge label

  for (const [k, _] of filteredNodes) {
    let visited: Map<number, number> = new Map()
    visited.set(k, 0)
    let stack = [k]

    while (stack.length > 0) {
      const n1 = stack.shift()

      for (const r of nodeMap.get(n1)!.rdeps) {
        if (visited.has(r)) {
          continue
        }
        const distance = visited.get(n1)! + 1
        visited.set(r, distance)
        if (showNode(nodeMap.get(r)!)) {
          nodeMap.get(r)!.allowedDeps.set(k, distance)
        } else {
          stack.push(r)
        }
      }
    }
  }

  // Build graph in a format that the graph library understands
  const data: NodeObject[] = []
  const edges: LinkObject[] = []

  for (const [k, node] of filteredNodes) {
    const target = build.targets(k)!

    const [sizeValue, maxValue] =
      selectedOption === NodeSizeOption.transitiveDeps
        ? [nodeMap.get(k)!.transitiveDeps, nodeMap.size]
        : selectedOption === NodeSizeOption.transitiveSrcs
        ? [nodeMap.get(k)!.transitiveSrcs, maxSrcs - 1]
        : [1, 1] // This should never happen

    // Add nodes to graph
    data.push({
      val: translateValues(sizeValue, maxValue), // controls size
      id: k,
      name: target.configuredTargetLabel()!,
      displayType: node.displayType,
      cfg: target.configuredTargetLabel()!.split('#')[1],
    })
  }

  for (const [k, node] of filteredNodes) {
    // Add edges
    for (const [d, counter] of node.allowedDeps) {
      if (!filteredNodes.has(d)) {
        throw Error("this shouldn't be possible")
      }
      edges.push({
        source: k,
        target: d,
        name: `steps: ${counter}`,
        color: 'rgba(20, 20, 20, 0.5)',
      })
    }
  }

  function applyFilters() {
    // TODO iguridi: this is nasty, but should do for now
    setSomepath(new Set())

    const inputValue = (id: string) =>
      (document.getElementById(id) as HTMLInputElement).value.trim()

    // Include exclude by label
    const inc = inputValue('includeContaining')
    setIncludeContaining(inc ? inc.split(',') : [])
    const exc = inputValue('excludeContaining')
    setExcludeContaining(exc ? exc.split(',') : [])

    // Include by rule type
    const checkboxes = document.querySelectorAll('#checkboxes input[type="checkbox"]')
    for (let i = 0; i < checkboxes.length; i++) {
      categories[i].checked = checkboxes[i].checked
    }
    setCategories([...categories])
  }

  function findPath() {
    const inputValue = (id: string) =>
      (document.getElementById(id) as HTMLInputElement).value.trim()

    // Include by path
    const pathFrom = inputValue('pathFrom')
    const pathTo = inputValue('pathTo')

    if (pathFrom && pathTo && allTargets) {
      const from = allTargets[pathFrom]
      const to = allTargets[pathTo]
      const parentOf = new Map()
      parentOf.set(from, null)
      const queue = [from]

      while (queue.length > 0) {
        let node = queue.shift()!
        if (node === to) {
          break
        }
        for (let d of nodeMap.get(node)!.deps) {
          if (!parentOf.has(d)) {
            parentOf.set(d, node)
            queue.push(d)
          }
        }
      }

      // set allowed if in path
      let path = new Set<number>()
      let node = to
      while (node) {
        path.add(node)
        node = parentOf.get(node)
      }

      setSomepath(path)
    }
  }

  const colorBy = colorByCfg ? 'cfg' : 'displayType'

  return (
    <>
      <div className="grid mt-4">
        <div className="cell">
          <div className="field">
            <label className="label">Filter by labels:</label>
            <div className="control">
              <input
                id="includeContaining"
                className="input"
                type="text"
                placeholder="Include containing"
              />
            </div>
            <div className="control">
              <input
                id="excludeContaining"
                className="input"
                type="text"
                placeholder="Exclude containing"
              />
            </div>
          </div>
        </div>
        <div className="cell">
          <div id="checkboxes">
            <div className="field">
              <label className="label">Include targets with rule types:</label>
              <RuleTypeDropdown options={categories} activeCount={activeCategories.length} />
            </div>
          </div>
          <button type="submit" onClick={applyFilters} className="button is-dark">
            <span>Apply filters</span>
          </button>
        </div>
        <div className="cell">
          <div className="select">
            <select
              value={selectedOption}
              onChange={e => setSelectedOption(parseInt(e.target.value))}>
              <option value={NodeSizeOption.transitiveDeps}>Size by transitive deps count</option>
              <option value={NodeSizeOption.transitiveSrcs}>Size by transitive srcs count</option>
            </select>
          </div>
          <label className="checkbox ml-2 mt-4">
            <input
              type="checkbox"
              checked={colorByCfg}
              onChange={e => setColorByCfg(e.target.checked)}></input>{' '}
            Color by configuration
          </label>
        </div>
        <div className="cell">
          <div className="field">
            <label className="label">Some path:</label>
            <div className="control">
              <input id="pathFrom" className="input" type="text" placeholder="from" />
            </div>
            <div className="control">
              <input id="pathTo" className="input" type="text" placeholder="to" />
            </div>
          </div>
          <div className="cell">
            <button type="submit" onClick={findPath} className="button is-dark">
              <span>Find some path</span>
            </button>
          </div>
        </div>
      </div>
      <article className="message">
        <div className="message-body">
          Number of nodes: {data.length} <br />
          Number of edges: {edges.length}
        </div>
      </article>

      <GraphViz
        nodes={data}
        colorBy={colorBy}
        links={edges}
        setPath={(name: string) => {
          const fromInput = document.getElementById('pathFrom') as HTMLInputElement
          const toInput = document.getElementById('pathTo') as HTMLInputElement
          if (!fromInput.value) {
            fromInput.value = name
          } else if (!toInput.value) {
            toInput.value = name
          } else {
            fromInput.value = name
            toInput.value = ''
          }
        }}
        openTarget={(name: string) => {
          const url = new URL(window.location.href)
          url.searchParams.set('target', name)
          url.searchParams.delete('graph')
          window.open(url.toString(), '_blank')
        }}
      />
    </>
  )
}

function translateValues(inputValue: number, maxValue: number) {
  const outputMin = 0.01
  const outputMax = 4
  const normalized = inputValue / maxValue
  const scaled = normalized * outputMax + outputMin
  return scaled
}
