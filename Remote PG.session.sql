SELECT * FROM bid_items;

--contract per month
select count(*), EXTRACT(MONTH FROM date_awarded) as month
    from contracts
    GROUP BY date_awarded
    ORDER BY month;

--win rate %
SELECT 
  contract_name,
  COUNT(*) as total_bids,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as bids_won,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as win_rate_percent
FROM contracts
GROUP BY contract_name
ORDER BY win_rate_percent DESC;


--Top bid items
SELECT c.contract_name, bi.bid_item_no,bi.description, bi.unit_price, bi.bid_value
FROM bid_items bi
INNER JOIN contracts c ON c.id = bi.contract_id
WHERE 1=1 


--win/loss
--Total Wins/Total Game Played






-- Insert fake bid_items data
INSERT INTO bid_items (contract_id, bid_item_no, description, specification_section_no, unit_of_measure, quantity_range, quantity_max, unit_price, bid_value) VALUES
-- Contract 1: Route 495 Expansion Phase 1
(1, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '1500-2000', 2000, 75.00, 150000.00),
(1, 2, 'Traffic Control and Safety Devices', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),
(1, 3, 'Signage and Pavement Markings', '402.10', 'SQFT', '5000-6000', 6000, 5.00, 30000.00),
(1, 4, 'Base Course Preparation', '304.00', 'TON', '800-1000', 1000, 40.00, 40000.00),

-- Contract 2: Interstate 66 Repair
(2, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '1000-1200', 1200, 75.00, 90000.00),
(2, 2, 'Pothole Patching', '420.00', 'TON', '50-100', 100, 100.00, 10000.00),
(2, 3, 'Concrete Repair', '500.00', 'SQFT', '2000-2500', 2500, 35.00, 87500.00),
(2, 4, 'Cleanup and Restoration', '401.01', 'LS', '1-1', 1, 12500.00, 12500.00),

-- Contract 3: Highway 50 Overlay
(3, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '3000-3500', 3500, 75.00, 262500.00),
(3, 2, 'Milling and Removal', '401.15', 'TON', '3000-3500', 3500, 15.00, 52500.00),
(3, 3, 'Traffic Control', '401.01', 'LS', '1-1', 1, 5000.00, 5000.00),

-- Contract 4: Route 7 Bridge Work
(4, 1, 'Concrete Placement', '500.00', 'CUYD', '500-600', 600, 200.00, 120000.00),
(4, 2, 'Structural Steel', '600.00', 'LB', '100000-150000', 150000, 2.50, 375000.00),
(4, 3, 'Bridge Deck Preparation', '401.01', 'SQFT', '10000-12000', 12000, 3.50, 42000.00),
(4, 4, 'Safety Railing Installation', '615.00', 'LF', '2000-2500', 2500, 85.00, 212500.00),

-- Contract 5: Dulles Road Construction
(5, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '2000-2500', 2500, 75.00, 187500.00),
(5, 2, 'Drainage System Installation', '500.00', 'LF', '5000-6000', 6000, 45.00, 270000.00),
(5, 3, 'Utility Relocation', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),
(5, 4, 'Traffic Control', '401.01', 'LS', '1-1', 1, 25000.00, 25000.00),

-- Contract 6: Northern Corridor Project
(6, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '2500-3000', 3000, 75.00, 225000.00),
(6, 2, 'Base Course Preparation', '304.00', 'TON', '1200-1500', 1500, 40.00, 60000.00),
(6, 3, 'Signage and Markings', '402.10', 'SQFT', '8000-10000', 10000, 5.00, 50000.00),
(6, 4, 'Traffic Management', '401.01', 'LS', '1-1', 1, 45000.00, 45000.00),

-- Contract 7: Downtown Street Improvement
(7, 1, 'Concrete Pavement', '500.00', 'SQFT', '15000-18000', 18000, 8.00, 144000.00),
(7, 2, 'Curb and Gutter', '601.00', 'LF', '5000-6000', 6000, 8.50, 51000.00),
(7, 3, 'Tree and Landscape', '700.00', 'LS', '1-1', 1, 30000.00, 30000.00),

-- Contract 8: Route 29 Widening
(8, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '4000-5000', 5000, 75.00, 375000.00),
(8, 2, 'Milling and Removal', '401.15', 'TON', '4000-5000', 5000, 15.00, 75000.00),
(8, 3, 'Base Course Preparation', '304.00', 'TON', '2000-2500', 2500, 40.00, 100000.00),
(8, 4, 'Traffic Control - Extended', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),

-- Contract 9: Intersection Redesign
(9, 1, 'Concrete Pavement', '500.00', 'SQFT', '10000-12000', 12000, 8.00, 96000.00),
(9, 2, 'Traffic Signal Installation', '615.00', 'LS', '1-1', 1, 35000.00, 35000.00),
(9, 3, 'Drainage and Storm Sewer', '500.00', 'LF', '2000-2500', 2500, 15.00, 37500.00),
(9, 4, 'Signage and Markings', '402.10', 'SQFT', '3000-4000', 4000, 5.00, 20000.00),

-- Contract 10: Parking Lot Reconstruction
(10, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '1000-1200', 1200, 75.00, 90000.00),
(10, 2, 'Base Course Preparation', '304.00', 'TON', '500-600', 600, 40.00, 24000.00),
(10, 3, 'Stripe and Markings', '402.10', 'SQFT', '8000-10000', 10000, 2.00, 20000.00),
(10, 4, 'Drainage Improvements', '500.00', 'LF', '1000-1200', 1200, 50.00, 60000.00),

-- Contract 11: Bridge Rehabilitation
(11, 1, 'Concrete Repair and Patching', '500.00', 'SQFT', '5000-6000', 6000, 50.00, 300000.00),
(11, 2, 'Structural Steel Reinforcement', '600.00', 'LB', '200000-250000', 250000, 2.50, 625000.00),
(11, 3, 'Bridge Deck Overlay', '401.19', 'TON', '500-600', 600, 100.00, 60000.00),
(11, 4, 'Bridge Inspection and Testing', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),

-- Contract 12: Surface Treatment Program
(12, 1, 'Chip Seal Treatment', '401.19', 'SQFT', '50000-60000', 60000, 2.50, 150000.00),
(12, 2, 'Crack Sealing', '420.00', 'LF', '10000-12000', 12000, 2.00, 24000.00),
(12, 3, 'Slurry Seal Application', '401.19', 'SQFT', '30000-40000', 40000, 1.50, 60000.00),

-- Contract 13: Drainage Improvements
(13, 1, 'Storm Sewer Installation', '500.00', 'LF', '5000-6000', 6000, 22.00, 132000.00),
(13, 2, 'Catch Basin Installation', '500.00', 'EA', '50-75', 75, 300.00, 22500.00),
(13, 3, 'Trench and Backfill', '500.00', 'CUYD', '300-400', 400, 35.00, 14000.00),

-- Contract 14: Safety Enhancement Project
(14, 1, 'Traffic Signal Upgrade', '615.00', 'LS', '1-1', 1, 75000.00, 75000.00),
(14, 2, 'Pedestrian Safety Equipment', '615.00', 'LS', '1-1', 1, 20000.00, 20000.00),

-- Contract 15: Main Street Reconstruction
(15, 1, 'Concrete Pavement', '500.00', 'SQFT', '20000-25000', 25000, 8.00, 200000.00),
(15, 2, 'Utility Coordination', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),
(15, 3, 'Traffic Management', '401.01', 'LS', '1-1', 1, 40000.00, 40000.00),
(15, 4, 'Landscaping and Hardscape', '700.00', 'LS', '1-1', 1, 80000.00, 80000.00),

-- Contract 16: Highway Maintenance Program
(16, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '2000-2500', 2500, 75.00, 187500.00),
(16, 2, 'Pothole Patching', '420.00', 'TON', '100-150', 150, 100.00, 15000.00),
(16, 3, 'Striping and Markings', '402.10', 'SQFT', '10000-12000', 12000, 3.00, 36000.00),
(16, 4, 'Shoulder Stabilization', '304.00', 'TON', '500-750', 750, 40.00, 30000.00),

-- Contract 17: Intersection Improvement
(17, 1, 'Concrete Pavement', '500.00', 'SQFT', '8000-10000', 10000, 8.00, 80000.00),
(17, 2, 'Traffic Signal Timing', '615.00', 'LS', '1-1', 1, 50000.00, 50000.00),
(17, 3, 'Signage Installation', '402.10', 'SQFT', '2000-3000', 3000, 5.00, 15000.00),
(17, 4, 'Drainage System', '500.00', 'LF', '1000-1500', 1500, 20.00, 30000.00),

-- Contract 18: Utility Corridor Work
(18, 1, 'Utility Trench Excavation', '500.00', 'CUYD', '500-750', 750, 50.00, 37500.00),
(18, 2, 'Underground Utility Installation', '600.00', 'LF', '10000-12000', 12000, 25.00, 300000.00),
(18, 3, 'Trench Restoration', '304.00', 'CUYD', '600-800', 800, 40.00, 32000.00),
(18, 4, 'Asphalt Restoration', '401.19', 'TON', '500-600', 600, 75.00, 45000.00),

-- Contract 19: Traffic Signal Upgrade
(19, 1, 'Signal Controller Replacement', '615.00', 'EA', '10-15', 15, 8000.00, 120000.00),
(19, 2, 'Signal Head Installation', '615.00', 'EA', '30-40', 40, 1500.00, 60000.00),
(19, 3, 'Conduit and Wiring', '615.00', 'LF', '5000-6000', 6000, 5.00, 30000.00),

-- Contract 20: Pavement Management Plan
(20, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '2000-2500', 2500, 75.00, 187500.00),
(20, 2, 'Mill and Overlay', '401.15', 'TON', '2000-2500', 2500, 20.00, 50000.00),
(20, 3, 'Striping and Markings', '402.10', 'SQFT', '12000-15000', 15000, 3.00, 45000.00),

-- Contract 21: Route 50 Widening
(21, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '3000-4000', 4000, 75.00, 300000.00),
(21, 2, 'Base Course', '304.00', 'TON', '1500-2000', 2000, 40.00, 80000.00),
(21, 3, 'Traffic Control - Extended', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),

-- Contract 22: Mill Creek Bridge Repair
(22, 1, 'Bridge Deck Repair', '500.00', 'SQFT', '8000-10000', 10000, 40.00, 400000.00),
(22, 2, 'Structural Inspection', '401.01', 'LS', '1-1', 1, 20000.00, 20000.00),
(22, 3, 'Safety Barrier Installation', '615.00', 'LF', '1000-1200', 1200, 75.00, 90000.00),

-- Contract 23: Fort Worth Downtown Loop
(23, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '4000-5000', 5000, 75.00, 375000.00),
(23, 2, 'Drainage Improvements', '500.00', 'LF', '8000-10000', 10000, 20.00, 200000.00),
(23, 3, 'Traffic Management', '401.01', 'LS', '1-1', 1, 50000.00, 50000.00),

-- Contract 24: Henderson Avenue Overlay
(24, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '1500-2000', 2000, 75.00, 150000.00),
(24, 2, 'Milling', '401.15', 'TON', '1500-2000', 2000, 15.00, 30000.00),
(24, 3, 'Striping', '402.10', 'SQFT', '8000-10000', 10000, 2.50, 25000.00),

-- Contract 25: Berry Street Reconstruction
(25, 1, 'Concrete Pavement', '500.00', 'SQFT', '12000-15000', 15000, 8.00, 120000.00),
(25, 2, 'Utility Coordination', '401.01', 'LS', '1-1', 1, 40000.00, 40000.00),
(25, 3, 'Traffic Control', '401.01', 'LS', '1-1', 1, 35000.00, 35000.00),

-- Contract 26: Seminary Drive Expansion
(26, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '3000-3500', 3500, 75.00, 262500.00),
(26, 2, 'Base Course Preparation', '304.00', 'TON', '1500-2000', 2000, 40.00, 80000.00),
(26, 3, 'Drainage System', '500.00', 'LF', '4000-5000', 5000, 25.00, 125000.00),
(26, 4, 'Traffic Control', '401.01', 'LS', '1-1', 1, 45000.00, 45000.00),

-- Contract 27: University Drive Resurfacing
(27, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '1500-2000', 2000, 75.00, 150000.00),
(27, 2, 'Milling and Removal', '401.15', 'TON', '1500-2000', 2000, 15.00, 30000.00),
(27, 3, 'Striping and Markings', '402.10', 'SQFT', '10000-12000', 12000, 3.00, 36000.00),

-- Contract 28: Rosedale Intersection Redesign
(28, 1, 'Concrete Pavement', '500.00', 'SQFT', '6000-8000', 8000, 8.00, 64000.00),
(28, 2, 'Traffic Signal Installation', '615.00', 'LS', '1-1', 1, 35000.00, 35000.00),
(28, 3, 'Drainage Improvements', '500.00', 'LF', '1500-2000', 2000, 18.00, 36000.00),

-- Contract 29: Forest Park Road Work
(29, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '1200-1500', 1500, 75.00, 112500.00),
(29, 2, 'Pothole Patching', '420.00', 'TON', '75-100', 100, 100.00, 10000.00),
(29, 3, 'Striping and Markings', '402.10', 'SQFT', '5000-6000', 6000, 3.00, 18000.00),

-- Contract 30: Tech Fort Worth Connector
(30, 1, 'Asphalt Paving - Hot Mix', '401.19', 'TON', '5000-6000', 6000, 75.00, 450000.00),
(30, 2, 'Base Course Preparation', '304.00', 'TON', '2500-3000', 3000, 40.00, 120000.00),
(30, 3, 'Drainage System Installation', '500.00', 'LF', '8000-10000', 10000, 22.00, 220000.00),
(30, 4, 'Traffic Management - Extended', '401.01', 'LS', '1-1', 1, 60000.00, 60000.00);