library(dplyr)
library(tidyr)


## Read master Table

master_table <- read.csv("/Users/pacha/Documents/github_projects/test_tsspredatorGui/TSSpredator-GUI/statistical_testing/data/TSSpredator-prediction_E.-coli-with-antibiotics/MasterTable.tsv", sep = "\t", header = T)


# Take only enriched positions and select relevant columns
master_table_filt <- master_table %>%
    filter(enriched == 1) %>%
    select("Condition","SuperPos", "SuperStrand", "GeneLength", "Primary", "Secondary", "Internal", "Antisense", "Locus_tag") %>%
    # From multiple boolean columns indicating TSS type, create a single TSS_Type column
    mutate(TSS_Type = case_when(
        Primary == 1 ~ "Primary",
        Secondary == 1 ~ "Secondary",
        Internal == 1 ~ "Internal",
        Antisense == 1 ~ "Antisense",
        TRUE ~ "Orphan"
    )) %>%
    select(-Primary, -Secondary, -Internal, -Antisense) %>%
    # arrange by tss type
    mutate(TSS_Type = factor(TSS_Type, levels = c("Primary", "Secondary", "Internal", "Antisense", "Orphan"))) %>%
    mutate(SuperPosAndStrand = paste(SuperPos, SuperStrand, sep = "_")) %>%
    arrange(Condition, SuperPosAndStrand, TSS_Type)


# Calculate mean gene length to approximate gene length later
mean_gene_length_by_genome <- master_table_filt %>%
    # remove duplicates based on Locus_tag
    distinct(Locus_tag, .keep_all = TRUE) %>%
    summarise(Mean_Gene_Length = mean(GeneLength, na.rm = TRUE))

# convert to list
mean_gene_length_list <- as.list(mean_gene_length_by_genome$Mean_Gene_Length)
names(mean_gene_length_list) <- mean_gene_length_by_genome$Condition

# Remove duplicates from master_table_filt based on Condition, SuperPos, SuperStrand. Keep the first occurrence (which is Primary if exists, then Secondary, etc)
master_table_unique <- master_table_filt %>%
    distinct(Condition, SuperPos, SuperStrand, .keep_all = TRUE)

    length(unique(master_table_unique %>% mutate(SuperPosAndStrand = paste(SuperPos, SuperStrand, sep = "_")) %>% pull(SuperPosAndStrand)))
dim(master_table_unique)
# get all files in the directory ending with .gr
dir_path <- "/Users/pacha/Documents/github_projects/test_tsspredatorGui/TSSpredator-GUI/statistical_testing/data/TSSpredator-prediction_E.-coli-with-antibiotics/"

gr_files <- list.files(path = dir_path, pattern = "\\.gr$", full.names = TRUE)
# filter for those containing superFivePrime
gr_files <- gr_files[grepl("superFivePrime", gr_files)]


expanded_master_table <- data.frame()
# Extract positions from each .gr file
# This might take a while
print("Starting to process .gr files for coverage extraction...")
print("This might take a while depending on the number of conditions and replicates.")
for (condition in unique(master_table_unique$Condition)) {
    print("--------------------------------------------------")
    print(paste("Processing condition:", condition))
    # filter master_table_unique for the current condition
    master_table_condition <- master_table_unique %>%
        filter(Condition == condition)
    
    # read the corresponding .gr file
    gr_file <- gr_files[grepl(condition, gr_files)]
    if (length(gr_file) == 0) {
        warning(paste("No .gr file found for condition:", condition))
        next
    }
    # length of replicates
    number_replicates <- length(gr_file)/2
    for (replicate in 1:number_replicates) {
        print(paste("  Processing replicate:", replicate))
        # from number to small caps (1 -> a, 2 -> b, etc)
        replicate_letter <- letters[replicate]
        # read the .gr file
        file_name_prefix <- paste0(condition, replicate_letter)
        gr_forward_name <- paste0(dir_path,file_name_prefix, "_superFivePrimePlus.gr")
        gr_reverse_name <- paste0(dir_path,file_name_prefix, "_superFivePrimeMinus.gr")
        # read the .gr files skipping first line
        gr_forward <- read.csv(gr_forward_name, sep = "\t", header = FALSE, skip = 1)
        gr_forward <- gr_forward %>%
            mutate(Strand = "+")
        gr_reverse <- read.csv(gr_reverse_name, sep = "\t", header = FALSE, skip = 1)
      
        gr_reverse <- gr_reverse %>%
            mutate(Strand = "-")
        # combine forward and reverse
        gr_combined <- bind_rows(gr_forward, gr_reverse)
        # rename columns
        colnames(gr_combined) <- c("Position", "Coverage", "Strand")


        # for each TSS in master_table_condition, get the coverage from gr_combined in a window of +- 20 around the TSS SuperPos
        coverage_results <- master_table_condition %>%
            rowwise() %>%
            mutate(
                replicate_ID = replicate_letter,
                Coverage_TSS = list({
                tss_pos <- SuperPos
                tss_strand <- SuperStrand
                # get coverage in window of +-20
                window_positions <- (tss_pos - 20):(tss_pos + 20)
                window_coverage <- gr_combined %>%
                    filter(Position %in% window_positions & Strand == tss_strand) %>%
                    complete(Position = window_positions, fill = list(Coverage = 0)) %>%
                    # join as a vector
                    pull(Coverage)
                if (tss_strand == "-") {
                    window_coverage <- -1 * window_coverage
                }
                # if something below zero, make 0
                # after normalization negative values can appear

                if (any(window_coverage < 0)) {
                    window_coverage <- pmax(window_coverage, 0)
                }
                window_coverage
            })) %>%
            ungroup()

          expanded_master_table <-  bind_rows(expanded_master_table, coverage_results)


    }
   
}


expanded_master_table$sum_coverage <- sapply(expanded_master_table$Coverage_TSS, function(x) abs(sum(x)))
expanded_master_table$list_as_string <- sapply(expanded_master_table$Coverage_TSS, function(x) paste(x, collapse = ";"))
# remove coverage_TSS column
expanded_master_table <- expanded_master_table %>% select(-Coverage_TSS)
# export
write.table(expanded_master_table, file = "TSS_Coverages_Ecoli.tsv", sep = "\t", row.names = FALSE)

