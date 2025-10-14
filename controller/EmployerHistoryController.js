import EmployeeHistoryModel from "../model/EmployeeHistoryModel.js";

// SEARCH EMPLOYEE HISTORY
export const viewEmployeeHistory = async (req, res) => {
    try {
        const {search} = req.query;

        if (!search || search.trim().length === 0) {
            const allHistory = await EmployeeHistoryModel.find()
                .select('-__v')
                .sort({release_date: -1});

            return res.status(200).json({
                success: true,
                count: allHistory.length,
                employees: allHistory
            });
        }

        const employeeHistory = await EmployeeHistoryModel.find({
            $or: [
                {full_name: {$regex: search, $options: 'i'}},
                {contact_number: {$regex: search, $options: 'i'}},
                {email_address: {$regex: search, $options: 'i'}},
                {occupation: {$regex: search, $options: 'i'}},
                {description: {$regex: search, $options: 'i'}}
            ]
        })
            .select('-__v')
            .sort({release_date: -1});

        if (employeeHistory.length === 0) {
            return res.status(404).json({
                message: `No employee found matching "${search}"`,
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            count: employeeHistory.length,
            search_term: search,
            employees: employeeHistory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching employee history!",
            error: error.message
        });
    }
};
