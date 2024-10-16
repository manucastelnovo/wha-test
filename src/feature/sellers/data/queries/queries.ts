export const UPDATE_DATABASE = `INSERT INTO sellers (id, name, phone, selling_zone, department, categories, farm, enterprise)
    VALUES
            %L
    ON CONFLICT (id) DO NOTHING
    RETURNING *
`;

export const GET_SELLER_NUMBER_BY_CATEGORY = `
    SELECT name, phone, contacted 
	    FROM sellers s 
		    WHERE $1 = ANY(s.categories) 
`;

export const UPDATE_SELLER_CONTACTED = `
    UPDATE sellers
    SET contacted = $1
    WHERE id = $2
    `;

export const RESET_LAST_CONTACTED = `
    UPDATE sellers
    SET contacted = $1
    WHERE phone = $2
`;
